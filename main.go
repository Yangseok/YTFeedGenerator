package main

import (
	"embed"
	_ "embed"
	"fmt"
	"log"
	"time"

	"ytfeedgenerator/backend/app"
	"ytfeedgenerator/backend/services"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/services/notifications"
)

// Wails uses Go's `embed` package to embed the frontend files into the binary.
// Any files in the frontend/dist folder will be embedded into the binary and
// made available to the frontend.
// See https://pkg.go.dev/embed for more information.

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var trayIcon []byte

func init() {
	// Register a custom event whose associated data type is string.
	// This is not required, but the binding generator will pick up registered events
	// and provide a strongly typed JS/TS API for them.
	application.RegisterEvent[string]("time")
}

// main function serves as the application's entry point. It initializes the application, creates a window,
// and starts a goroutine that emits a time-based event every second. It subsequently runs the application and
// logs any error that might occur.
func main() {

	// Create a new Wails application by providing the necessary options.
	// Variables 'Name' and 'Description' are for application metadata.
	// 'Assets' configures the asset server with the 'FS' variable pointing to the frontend files.
	// 'Bind' is a list of Go struct instances. The frontend has access to the methods of these instances.
	// 'Mac' options tailor the application when running an macOS.
	notifier := notifications.New()
	appService, err := app.NewAppService("ytfeed.db")
	if err != nil {
		log.Fatal(err)
	}
	appService.Notification = &services.NotificationService{Notifier: notifier}

	app := application.New(application.Options{
		Name:        "YTFeedGenerator",
		Description: "YouTube feed summarizer and collector",
		Services: []application.Service{
			application.NewService(appService),
			application.NewService(notifier),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: false,
		},
	})

	// Create a new window with the necessary options.
	// 'Title' is the title of the window.
	// 'Mac' options tailor the window when running on macOS.
	// 'BackgroundColour' is the background colour of the window.
	// 'URL' is the URL that will be loaded into the webview.
	mainWindow := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title: "Window 1",
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",
	})

	tray := app.SystemTray.New()
	tray.SetLabel("YT")
	tray.SetTooltip("YTFeedGenerator")
	if len(trayIcon) > 0 {
		tray.SetIcon(trayIcon)
	}

	trayMenu := app.NewMenu()
	showItem := trayMenu.Add("Show")
	syncItem := trayMenu.Add("Sync Now")
	trayMenu.AddSeparator()
	quitItem := trayMenu.Add("Quit")
	tray.SetMenu(trayMenu)

	showItem.OnClick(func(_ *application.Context) {
		mainWindow.Show()
		mainWindow.Focus()
	})

	syncItem.OnClick(func(_ *application.Context) {
		go func() {
			summary, err := appService.SyncAllChannels()
			if err != nil {
				_ = appService.Notification.Notify(nil, "Sync failed", err.Error())
				return
			}
			msg := fmt.Sprintf("New: %d, Updated: %d", summary.TotalNew, summary.TotalUpdated)
			_ = appService.Notification.Notify(nil, "Sync complete", msg)
		}()
	})

	quitItem.OnClick(func(_ *application.Context) {
		app.Quit()
	})

	tray.OnClick(func() {
		mainWindow.Show()
		mainWindow.Focus()
	})

	// Create a goroutine that emits an event containing the current time every second.
	// The frontend can listen to this event and update the UI accordingly.
	go func() {
		for {
			now := time.Now().Format(time.RFC1123)
			app.Event.Emit("time", now)
			time.Sleep(time.Second)
		}
	}()

	go func() {
		for {
			settings := appService.GetSyncSettings()
			if !settings.Enabled {
				time.Sleep(10 * time.Second)
				continue
			}
			interval := time.Duration(settings.IntervalMinutes) * time.Minute
			if interval < time.Minute {
				interval = time.Minute
			}
			time.Sleep(interval)

			summary, err := appService.SyncAllChannels()
			if err != nil {
				if settings.NotificationsEnabled {
					_ = appService.Notification.Notify(nil, "Sync failed", err.Error())
				}
				continue
			}
			if settings.NotificationsEnabled && summary.TotalNew > 0 {
				msg := fmt.Sprintf("New: %d, Updated: %d", summary.TotalNew, summary.TotalUpdated)
				_ = appService.Notification.Notify(nil, "New videos detected", msg)
			}
		}
	}()

	go func() {
		for {
			settings, err := appService.GetAppSettings()
			if err != nil {
				time.Sleep(30 * time.Second)
				continue
			}
			if !settings.AutoSummaryEnabled {
				time.Sleep(30 * time.Second)
				continue
			}
			interval := time.Duration(settings.SummaryIntervalMinutes) * time.Minute
			if interval < time.Minute {
				interval = time.Minute
			}
			time.Sleep(interval)

			count, err := appService.AutoSummarizePending()
			if err != nil {
				if settings.NotificationsEnabled {
					_ = appService.Notification.Notify(nil, "Auto summary failed", err.Error())
				}
				continue
			}
			if settings.NotificationsEnabled && count > 0 {
				_ = appService.Notification.Notify(nil, "Auto summary complete", fmt.Sprintf("Summarized %d videos", count))
			}
		}
	}()

	// Run the application. This blocks until the application has been exited.
	err = app.Run()

	// If an error occurred while running the application, log it and exit.
	if err != nil {
		log.Fatal(err)
	}
}
