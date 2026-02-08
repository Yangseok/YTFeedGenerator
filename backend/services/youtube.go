package services

import (
	"context"
	"encoding/xml"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type YouTubeService struct {
	Client *http.Client
}

type YouTubeFeed struct {
	ChannelID   string
	ChannelName string
	ChannelURL  string
	Entries     []YouTubeEntry
}

type YouTubeEntry struct {
	VideoID     string
	Title       string
	URL         string
	Thumbnail   string
	PublishedAt time.Time
	UpdatedAt   time.Time
}

func (s *YouTubeService) FetchChannelFeed(ctx context.Context, channelID string) (*YouTubeFeed, error) {
	if channelID == "" {
		return nil, fmt.Errorf("channelID is required")
	}

	client := s.Client
	if client == nil {
		client = &http.Client{Timeout: 15 * time.Second}
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, feedURL(channelID), nil)
	if err != nil {
		return nil, err
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("feed request failed: status %d", resp.StatusCode)
	}

	var raw ytFeed
	if err := xml.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return nil, err
	}

	channelID = extractChannelID(raw.ID, channelID)
	channelURL := fmt.Sprintf("https://www.youtube.com/channel/%s", channelID)

	feed := &YouTubeFeed{
		ChannelID:   channelID,
		ChannelName: strings.TrimSpace(raw.Author.Name),
		ChannelURL:  channelURL,
		Entries:     make([]YouTubeEntry, 0, len(raw.Entries)),
	}

	for _, entry := range raw.Entries {
		videoID := extractVideoID(entry.ID)
		publishedAt, _ := time.Parse(time.RFC3339, entry.Published)
		updatedAt, _ := time.Parse(time.RFC3339, entry.Updated)
		feed.Entries = append(feed.Entries, YouTubeEntry{
			VideoID:     videoID,
			Title:       strings.TrimSpace(entry.Title),
			URL:         entry.Link.Href,
			Thumbnail:   entry.MediaGroup.Thumbnail.URL,
			PublishedAt: publishedAt,
			UpdatedAt:   updatedAt,
		})
	}

	return feed, nil
}

func feedURL(channelID string) string {
	return fmt.Sprintf("https://www.youtube.com/feeds/videos.xml?channel_id=%s", channelID)
}

func extractChannelID(id, fallback string) string {
	if strings.HasPrefix(id, "yt:channel:") {
		return strings.TrimPrefix(id, "yt:channel:")
	}
	return fallback
}

func extractVideoID(id string) string {
	if strings.HasPrefix(id, "yt:video:") {
		return strings.TrimPrefix(id, "yt:video:")
	}
	return id
}

type ytFeed struct {
	ID      string    `xml:"id"`
	Title   string    `xml:"title"`
	Author  ytAuthor  `xml:"author"`
	Entries []ytEntry `xml:"entry"`
}

type ytAuthor struct {
	Name string `xml:"name"`
	URI  string `xml:"uri"`
}

type ytEntry struct {
	ID         string       `xml:"id"`
	Title      string       `xml:"title"`
	Link       ytLink       `xml:"link"`
	Published  string       `xml:"published"`
	Updated    string       `xml:"updated"`
	MediaGroup ytMediaGroup `xml:"media:group"`
}

type ytLink struct {
	Href string `xml:"href,attr"`
}

type ytMediaGroup struct {
	Thumbnail ytThumbnail `xml:"media:thumbnail"`
}

type ytThumbnail struct {
	URL string `xml:"url,attr"`
}
