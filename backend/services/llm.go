package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type LLMProvider string

const (
	ProviderOpenAI LLMProvider = "openai"
	ProviderOllama LLMProvider = "ollama"
)

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type LLMRequest struct {
	Provider     string
	Model        string
	BaseURL      string
	APIKey       string
	SystemPrompt string
	UserPrompt   string
	Temperature  float64
}

type LLMService struct {
	Client *http.Client
}

func (s *LLMService) Chat(ctx context.Context, req LLMRequest) (string, error) {
	provider := strings.ToLower(strings.TrimSpace(req.Provider))
	switch LLMProvider(provider) {
	case ProviderOpenAI:
		return s.chatOpenAI(ctx, req)
	case ProviderOllama:
		return s.chatOllama(ctx, req)
	default:
		return "", fmt.Errorf("unsupported provider: %s", req.Provider)
	}
}

func (s *LLMService) chatOpenAI(ctx context.Context, req LLMRequest) (string, error) {
	if req.Model == "" {
		return "", fmt.Errorf("model is required")
	}
	baseURL := strings.TrimRight(req.BaseURL, "/")
	if baseURL == "" {
		baseURL = "https://api.openai.com"
	}

	body := openAIChatRequest{
		Model: req.Model,
		Messages: []ChatMessage{
			{Role: "system", Content: req.SystemPrompt},
			{Role: "user", Content: req.UserPrompt},
		},
		Temperature: req.Temperature,
		Stream:      false,
	}

	raw, err := json.Marshal(body)
	if err != nil {
		return "", err
	}

	client := s.Client
	if client == nil {
		client = &http.Client{Timeout: 30 * time.Second}
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL+"/v1/chat/completions", bytes.NewReader(raw))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+req.APIKey)

	resp, err := client.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("openai request failed: status %d", resp.StatusCode)
	}

	var out openAIChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}
	if len(out.Choices) == 0 {
		return "", fmt.Errorf("openai response missing choices")
	}
	return strings.TrimSpace(out.Choices[0].Message.Content), nil
}

func (s *LLMService) chatOllama(ctx context.Context, req LLMRequest) (string, error) {
	if req.Model == "" {
		return "", fmt.Errorf("model is required")
	}
	baseURL := strings.TrimRight(req.BaseURL, "/")
	if baseURL == "" {
		baseURL = "http://localhost:11434"
	}

	body := ollamaChatRequest{
		Model: req.Model,
		Messages: []ChatMessage{
			{Role: "system", Content: req.SystemPrompt},
			{Role: "user", Content: req.UserPrompt},
		},
		Stream: false,
	}
	if req.Temperature > 0 {
		body.Options = &ollamaOptions{Temperature: req.Temperature}
	}

	raw, err := json.Marshal(body)
	if err != nil {
		return "", err
	}

	client := s.Client
	if client == nil {
		client = &http.Client{Timeout: 30 * time.Second}
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL+"/api/chat", bytes.NewReader(raw))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("ollama request failed: status %d", resp.StatusCode)
	}

	var out ollamaChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}
	return strings.TrimSpace(out.Message.Content), nil
}

type openAIChatRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	Temperature float64       `json:"temperature,omitempty"`
	Stream      bool          `json:"stream"`
}

type openAIChatResponse struct {
	Choices []struct {
		Message ChatMessage `json:"message"`
	} `json:"choices"`
}

type ollamaChatRequest struct {
	Model    string         `json:"model"`
	Messages []ChatMessage  `json:"messages"`
	Stream   bool           `json:"stream"`
	Options  *ollamaOptions `json:"options,omitempty"`
}

type ollamaOptions struct {
	Temperature float64 `json:"temperature,omitempty"`
}

type ollamaChatResponse struct {
	Message ChatMessage `json:"message"`
}
