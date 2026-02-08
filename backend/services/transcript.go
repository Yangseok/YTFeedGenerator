package services

import (
	"context"
	"fmt"
	"strings"

	"github.com/horiagug/youtube-transcript-api-go/pkg/yt_transcript"
	"github.com/horiagug/youtube-transcript-api-go/pkg/yt_transcript_formatters"
)

type TranscriptService struct{}

func (s *TranscriptService) FetchTranscript(ctx context.Context, videoID string, languages []string) (string, error) {
	_ = ctx

	id := extractVideoIDFromInput(videoID)
	if id == "" {
		return "", fmt.Errorf("videoID is required")
	}
	if len(languages) == 0 {
		languages = []string{"en"}
	}

	formatter := yt_transcript_formatters.NewTextFormatter(
		yt_transcript_formatters.WithTimestamps(false),
	)
	client := yt_transcript.NewClient(
		yt_transcript.WithFormatter(formatter),
	)

	transcript, err := client.GetFormattedTranscripts(id, languages, true)
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(transcript), nil
}

func extractVideoIDFromInput(input string) string {
	input = strings.TrimSpace(input)
	if input == "" {
		return ""
	}
	if strings.HasPrefix(input, "http://") || strings.HasPrefix(input, "https://") {
		if idx := strings.Index(input, "v="); idx != -1 {
			id := input[idx+2:]
			if amp := strings.Index(id, "&"); amp != -1 {
				id = id[:amp]
			}
			return id
		}
		if idx := strings.Index(input, "youtu.be/"); idx != -1 {
			id := input[idx+9:]
			if slash := strings.Index(id, "/"); slash != -1 {
				id = id[:slash]
			}
			if q := strings.Index(id, "?"); q != -1 {
				id = id[:q]
			}
			return id
		}
		return ""
	}
	return input
}
