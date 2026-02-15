package services

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	_ "embed"

	"github.com/phpdave11/gofpdf"
)

type ExportService struct{}

//go:embed assets/fonts/NanumGothic.ttf
var nanumGothicTTF []byte

func (s *ExportService) ExportMarkdown(ctx context.Context, content string, baseDir string, filename string) (string, error) {
	_ = ctx
	if filename == "" {
		filename = fmt.Sprintf("export-%s.md", time.Now().Format("20060102-150405"))
	}
	if baseDir == "" {
		baseDir = "exports"
	}
	if err := os.MkdirAll(baseDir, 0o755); err != nil {
		return "", err
	}
	path := filepath.Join(baseDir, filename)
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		return "", err
	}
	return path, nil
}

func (s *ExportService) ExportMarkdownToPath(ctx context.Context, content string, path string) (string, error) {
	_ = ctx
	if strings.TrimSpace(path) == "" {
		return "", fmt.Errorf("export path is required")
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return "", err
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		return "", err
	}
	return path, nil
}

func (s *ExportService) ExportPDF(ctx context.Context, content string, baseDir string, filename string) (string, error) {
	_ = ctx
	if filename == "" {
		filename = fmt.Sprintf("export-%s.pdf", time.Now().Format("20060102-150405"))
	}
	if baseDir == "" {
		baseDir = "exports"
	}
	if err := os.MkdirAll(baseDir, 0o755); err != nil {
		return "", err
	}
	path := filepath.Join(baseDir, filename)

	pdfBytes, err := buildUnicodePDF(content)
	if err != nil {
		pdfBytes = buildSimplePDF(content)
	}
	if err := os.WriteFile(path, pdfBytes, 0o644); err != nil {
		return "", err
	}
	return path, nil
}

func (s *ExportService) ExportPDFToPath(ctx context.Context, content string, path string) (string, error) {
	_ = ctx
	if strings.TrimSpace(path) == "" {
		return "", fmt.Errorf("export path is required")
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return "", err
	}
	pdfBytes, err := buildUnicodePDF(content)
	if err != nil {
		pdfBytes = buildSimplePDF(content)
	}
	if err := os.WriteFile(path, pdfBytes, 0o644); err != nil {
		return "", err
	}
	return path, nil
}

func buildSimplePDF(content string) []byte {
	lines := wrapTextLines(content, 92)
	var stream strings.Builder
	stream.WriteString("BT\n/F1 12 Tf\n72 720 Td\n")
	for i, line := range lines {
		if i > 0 {
			stream.WriteString("0 -14 Td\n")
		}
		stream.WriteString("(")
		stream.WriteString(escapePDFText(line))
		stream.WriteString(") Tj\n")
	}
	stream.WriteString("ET\n")

	streamBytes := []byte(stream.String())
	objects := []string{
		"<< /Type /Catalog /Pages 2 0 R >>",
		"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
		"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
		fmt.Sprintf("<< /Length %d >>\nstream\n%s\nendstream", len(streamBytes), stream.String()),
		"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
	}

	var out strings.Builder
	out.WriteString("%PDF-1.4\n")
	offsets := make([]int, len(objects)+1)
	for i, obj := range objects {
		offsets[i+1] = out.Len()
		out.WriteString(fmt.Sprintf("%d 0 obj\n%s\nendobj\n", i+1, obj))
	}

	xrefPos := out.Len()
	out.WriteString("xref\n")
	out.WriteString(fmt.Sprintf("0 %d\n", len(objects)+1))
	out.WriteString("0000000000 65535 f \n")
	for i := 1; i <= len(objects); i++ {
		out.WriteString(fmt.Sprintf("%010d 00000 n \n", offsets[i]))
	}
	out.WriteString("trailer\n")
	out.WriteString(fmt.Sprintf("<< /Size %d /Root 1 0 R >>\n", len(objects)+1))
	out.WriteString("startxref\n")
	out.WriteString(fmt.Sprintf("%d\n", xrefPos))
	out.WriteString("%%EOF\n")

	return []byte(out.String())
}

func buildUnicodePDF(content string) ([]byte, error) {
	pdf := gofpdf.New("P", "pt", "A4", "")
	pdf.SetMargins(54, 54, 54)
	pdf.SetAutoPageBreak(true, 54)
	pdf.AddPage()

	fontPath, err := addUnicodeFont(pdf)
	if err != nil {
		return nil, err
	}
	pdf.SetFont("Body", "", 12)

	lines := strings.Split(strings.ReplaceAll(content, "\r\n", "\n"), "\n")
	for _, line := range lines {
		if strings.TrimSpace(line) == "" {
			pdf.Ln(14)
			continue
		}
		pdf.MultiCell(0, 16, line, "", "L", false)
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	_ = fontPath
	return buf.Bytes(), nil
}

func addUnicodeFont(pdf *gofpdf.Fpdf) (string, error) {
	if len(nanumGothicTTF) > 0 {
		pdf.AddUTF8FontFromBytes("Body", "", nanumGothicTTF)
		if pdf.Error() == nil {
			return "embedded:NanumGothic.ttf", nil
		}
		pdf.SetError(nil)
	}
	for _, path := range unicodeFontCandidates() {
		pdf.AddUTF8Font("Body", "", path)
		if pdf.Error() == nil {
			return path, nil
		}
		pdf.SetError(nil)
	}
	return "", fmt.Errorf("no unicode font found for PDF export")
}

func unicodeFontCandidates() []string {
	candidates := []string{}
	switch runtime.GOOS {
	case "windows":
		candidates = []string{
			`C:\Windows\Fonts\malgun.ttf`,
			`C:\Windows\Fonts\msgothic.ttc`,
			`C:\Windows\Fonts\meiryo.ttc`,
		}
	case "darwin":
		candidates = []string{
			"/System/Library/Fonts/AppleSDGothicNeo.ttc",
			"/System/Library/Fonts/Supplemental/AppleGothic.ttf",
			"/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
		}
	default:
		candidates = []string{
			"/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
			"/usr/share/fonts/truetype/nanum/NanumSquareR.ttf",
			"/usr/share/fonts/truetype/nanum/NanumBarunGothic.ttf",
			"/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
			"/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc",
		}
	}
	return candidates
}

func escapePDFText(input string) string {
	replacer := strings.NewReplacer("\\", "\\\\", "(", "\\(", ")", "\\)")
	return replacer.Replace(input)
}

func wrapTextLines(input string, width int) []string {
	if width <= 0 {
		return []string{input}
	}
	input = strings.ReplaceAll(input, "\r\n", "\n")
	paragraphs := strings.Split(input, "\n")
	lines := make([]string, 0, len(paragraphs))
	for _, p := range paragraphs {
		p = strings.TrimRight(p, " ")
		if p == "" {
			lines = append(lines, "")
			continue
		}
		words := strings.Fields(p)
		if len(words) == 0 {
			lines = append(lines, "")
			continue
		}
		current := words[0]
		for _, w := range words[1:] {
			if len(current)+1+len(w) > width {
				lines = append(lines, current)
				current = w
			} else {
				current += " " + w
			}
		}
		lines = append(lines, current)
	}
	return lines
}
