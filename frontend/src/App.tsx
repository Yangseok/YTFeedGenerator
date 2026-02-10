import { useState, useEffect } from 'react'
import { Browser, Events, WML } from "@wailsio/runtime";
import { AppService } from "../bindings/ytfeedgenerator/backend/app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";

function App() {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<string>('Feed');
  const [time, setTime] = useState<string>('Listening for Time event...');
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState<boolean>(false);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [summaryExpanded, setSummaryExpanded] = useState<boolean>(false);
  const [detailTab, setDetailTab] = useState<"summary" | "transcript">("summary");
  const [llmProvider, setLlmProvider] = useState<"ollama" | "openai">("ollama");
  const [openAIKey, setOpenAIKey] = useState<string>("");
  const [openAIModel, setOpenAIModel] = useState<string>("gpt-4o-mini");
  const [ollamaURL, setOllamaURL] = useState<string>("http://localhost:11434");
  const [channels, setChannels] = useState<any[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState<boolean>(false);
  const [channelInput, setChannelInput] = useState<string>("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(false);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    prompt: "",
    variables: `["text"]`,
    isDefault: false,
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templateImportJSON, setTemplateImportJSON] = useState<string>("");
  const [templateExportJSON, setTemplateExportJSON] = useState<string>("");
  const [templateOverwrite, setTemplateOverwrite] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string>("");
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState<boolean>(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [collectionInput, setCollectionInput] = useState({
    name: "",
    description: "",
  });
  const [collectionVideos, setCollectionVideos] = useState<any[]>([]);
  const [collectionVideoIdInput, setCollectionVideoIdInput] = useState<string>("");
  const [tags, setTags] = useState<any[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState<boolean>(false);
  const [tagInput, setTagInput] = useState({
    name: "",
    color: "",
  });
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [filterChannelId, setFilterChannelId] = useState<string>("");
  const [filterTagId, setFilterTagId] = useState<number | null>(null);
  const [recentlySummarizedVideoId, setRecentlySummarizedVideoId] = useState<string | null>(null);
  const [feedNotice, setFeedNotice] = useState<string>("");
  const [collectionSearchQuery, setCollectionSearchQuery] = useState<string>("");
  const [collectionSearchResults, setCollectionSearchResults] = useState<any[]>([]);
  const [isSearchingCollections, setIsSearchingCollections] = useState<boolean>(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const [syncIntervalMinutes, setSyncIntervalMinutes] = useState<number>(30);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [responseLanguage, setResponseLanguage] = useState<string>("ko");
  const [autoSummaryEnabled, setAutoSummaryEnabled] = useState<boolean>(false);
  const [summaryIntervalMinutes, setSummaryIntervalMinutes] = useState<number>(60);
  const [summaryBatchSize, setSummaryBatchSize] = useState<number>(3);
  const [backupPath, setBackupPath] = useState<string>("");
  const [importPath, setImportPath] = useState<string>("");
  const [restoreDB, setRestoreDB] = useState<boolean>(false);
  const [restoreResult, setRestoreResult] = useState<string>("");

  useEffect(() => {
    Events.On('time', (timeValue: any) => {
      setTime(timeValue.data);
    });
    // Reload WML so it picks up the wml tags
    WML.Reload();
  }, []);

  useEffect(() => {
    AppService.GetAppSettings().then((settings: any) => {
      if (settings.LLMProvider) setLlmProvider(settings.LLMProvider);
      if (settings.OpenAIKey) setOpenAIKey(settings.OpenAIKey);
      if (settings.OpenAIModel) setOpenAIModel(settings.OpenAIModel);
      if (settings.OllamaURL) setOllamaURL(settings.OllamaURL);
      if (settings.ResponseLanguage) setResponseLanguage(settings.ResponseLanguage);
      if (typeof settings.AutoSummaryEnabled === "boolean") setAutoSummaryEnabled(settings.AutoSummaryEnabled);
      if (settings.SummaryIntervalMinutes) setSummaryIntervalMinutes(settings.SummaryIntervalMinutes);
      if (settings.SummaryBatchSize) setSummaryBatchSize(settings.SummaryBatchSize);
      if (typeof settings.AutoSyncEnabled === "boolean") setAutoSyncEnabled(settings.AutoSyncEnabled);
      if (settings.SyncIntervalMinutes) setSyncIntervalMinutes(settings.SyncIntervalMinutes);
      if (typeof settings.NotificationsEnabled === "boolean") setNotificationsEnabled(settings.NotificationsEnabled);
    }).catch((err: any) => {
      reportError(err, "GetAppSettings");
    });

    const saved = localStorage.getItem("ytfg.settings");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as {
        llmProvider?: "ollama" | "openai";
        openAIModel?: string;
        ollamaURL?: string;
        selectedTemplate?: string;
        autoSyncEnabled?: boolean;
        syncIntervalMinutes?: number;
        notificationsEnabled?: boolean;
        responseLanguage?: string;
        autoSummaryEnabled?: boolean;
        summaryIntervalMinutes?: number;
        summaryBatchSize?: number;
      };
      if (parsed.llmProvider) setLlmProvider(parsed.llmProvider);
      if (parsed.openAIModel) setOpenAIModel(parsed.openAIModel);
      if (parsed.ollamaURL) setOllamaURL(parsed.ollamaURL);
      if (parsed.selectedTemplate) setSelectedTemplate(parsed.selectedTemplate);
      if (parsed.responseLanguage) setResponseLanguage(parsed.responseLanguage);
      if (parsed.autoSummaryEnabled !== undefined) setAutoSummaryEnabled(parsed.autoSummaryEnabled);
      if (parsed.summaryIntervalMinutes) setSummaryIntervalMinutes(parsed.summaryIntervalMinutes);
      if (parsed.summaryBatchSize) setSummaryBatchSize(parsed.summaryBatchSize);
      if (parsed.autoSyncEnabled !== undefined) setAutoSyncEnabled(parsed.autoSyncEnabled);
      if (parsed.syncIntervalMinutes) setSyncIntervalMinutes(parsed.syncIntervalMinutes);
      if (parsed.notificationsEnabled !== undefined) setNotificationsEnabled(parsed.notificationsEnabled);
    } catch {
      // ignore invalid saved settings
    }
  }, []);

  useEffect(() => {
    const payload = {
      llmProvider,
      openAIModel,
      ollamaURL,
      selectedTemplate,
      autoSyncEnabled,
      syncIntervalMinutes,
      notificationsEnabled,
      responseLanguage,
      autoSummaryEnabled,
      summaryIntervalMinutes,
      summaryBatchSize,
    };
    localStorage.setItem("ytfg.settings", JSON.stringify(payload));
  }, [llmProvider, openAIModel, ollamaURL, selectedTemplate, autoSyncEnabled, syncIntervalMinutes, notificationsEnabled, responseLanguage, autoSummaryEnabled, summaryIntervalMinutes, summaryBatchSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      AppService.SaveAppSettings({
        LLMProvider: llmProvider,
        OpenAIKey: openAIKey,
        OpenAIModel: openAIModel,
        OllamaURL: ollamaURL,
        ResponseLanguage: responseLanguage,
        SelectedTemplate: selectedTemplate,
        AutoSyncEnabled: autoSyncEnabled,
        SyncIntervalMinutes: syncIntervalMinutes,
        NotificationsEnabled: notificationsEnabled,
        AutoSummaryEnabled: autoSummaryEnabled,
        SummaryIntervalMinutes: summaryIntervalMinutes,
        SummaryBatchSize: summaryBatchSize,
      }).catch((err: any) => reportError(err, "SaveAppSettings"));
    }, 400);
    return () => clearTimeout(timer);
  }, [llmProvider, openAIKey, openAIModel, ollamaURL, responseLanguage, selectedTemplate, autoSyncEnabled, syncIntervalMinutes, notificationsEnabled, autoSummaryEnabled, summaryIntervalMinutes, summaryBatchSize]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const reportError = (err: any, context: string) => {
    console.log(err);
    const message = `${context}: ${String(err)}`;
    AppService.LogClientError(message).catch(() => {});
  };

  const loadVideos = () => {
    setIsLoadingVideos(true);
    AppService.ListVideos(30, 0, {
      ChannelID: filterChannelId,
      TagID: filterTagId ?? 0,
      Query: filterQuery,
    }).then((items: any[]) => {
      setVideos(items || []);
    }).catch((err: any) => {
      reportError(err, "ListVideos");
    }).finally(() => {
      setIsLoadingVideos(false);
    });
  }

  const summarizeSelected = () => {
    if (!selectedVideo) return;
    setIsSummarizing(true);
    setSummaryError("");
    const provider = llmProvider;
    const model = provider === "openai" ? openAIModel : openAIModel ? openAIModel : "llama3";
    const baseURL = provider === "openai" ? "https://api.openai.com" : ollamaURL;
    const apiKey = provider === "openai" ? openAIKey : "";

    AppService.SummarizeVideo(
      selectedVideo.VideoID,
      selectedTemplate,
      provider,
      model,
      baseURL,
      apiKey,
      0.4
    ).then((summary: string) => {
      setSelectedVideo({ ...selectedVideo, Summary: summary });
      setRecentlySummarizedVideoId(selectedVideo.VideoID);
      setTimeout(() => setRecentlySummarizedVideoId(null), 3000);
      loadVideos();
    }).catch((err: any) => {
      reportError(err, "SummarizeVideo");
      setSummaryError(String(err));
    }).finally(() => {
      setIsSummarizing(false);
    });
  }

  const autoTagSelected = () => {
    if (!selectedVideo) return;
    const provider = llmProvider;
    const model = provider === "openai" ? openAIModel : "llama3";
    const baseURL = provider === "openai" ? "https://api.openai.com" : ollamaURL;
    const apiKey = provider === "openai" ? openAIKey : "";
    AppService.AutoTagVideo(
      selectedVideo.VideoID,
      provider,
      model,
      baseURL,
      apiKey,
      0.2
    ).then(() => {
      loadTags();
    }).catch((err: any) => {
      reportError(err, "AutoTagVideo");
    });
  }

  const loadChannels = () => {
    setIsLoadingChannels(true);
    AppService.ListChannels().then((items: any[]) => {
      setChannels(items || []);
    }).catch((err: any) => {
      reportError(err, "ListChannels");
    }).finally(() => {
      setIsLoadingChannels(false);
    });
  }

  const loadTemplates = () => {
    setIsLoadingTemplates(true);
    AppService.ListTemplates().then((items: any[]) => {
      setTemplates(items || []);
    }).catch((err: any) => {
      reportError(err, "ListTemplates");
    }).finally(() => {
      setIsLoadingTemplates(false);
    });
  }

  const loadCollections = () => {
    setIsLoadingCollections(true);
    AppService.ListCollections().then((items: any[]) => {
      setCollections(items || []);
    }).catch((err: any) => {
      reportError(err, "ListCollections");
    }).finally(() => {
      setIsLoadingCollections(false);
    });
  }

  const loadTags = () => {
    setIsLoadingTags(true);
    AppService.ListTags().then((items: any[]) => {
      setTags(items || []);
    }).catch((err: any) => {
      reportError(err, "ListTags");
    }).finally(() => {
      setIsLoadingTags(false);
    });
  }

  const createTag = () => {
    if (!tagInput.name.trim()) return;
    AppService.CreateTag({
      Name: tagInput.name.trim(),
      Color: tagInput.color,
      AutoGenerated: false,
    }).then(() => {
      setTagInput({ name: "", color: "" });
      loadTags();
    }).catch((err: any) => {
      reportError(err, "CreateTag");
    });
  }

  const deleteTag = (id: number) => {
    AppService.DeleteTag(id).then(() => {
      loadTags();
    }).catch((err: any) => {
      reportError(err, "DeleteTag");
    });
  }

  const createCollection = () => {
    if (!collectionInput.name.trim()) return;
    AppService.CreateCollection({
      Name: collectionInput.name.trim(),
      Description: collectionInput.description,
    }).then(() => {
      setCollectionInput({ name: "", description: "" });
      loadCollections();
    }).catch((err: any) => {
      reportError(err, "CreateCollection");
    });
  }

  const deleteCollection = (id: number) => {
    AppService.DeleteCollection(id).then(() => {
      if (selectedCollectionId === id) {
        setSelectedCollectionId(null);
        setCollectionVideos([]);
      }
      loadCollections();
    }).catch((err: any) => {
      reportError(err, "DeleteCollection");
    });
  }

  const loadCollectionVideos = (id: number) => {
    AppService.ListCollectionVideos(id).then((items: any[]) => {
      setCollectionVideos(items || []);
    }).catch((err: any) => {
      reportError(err, "ListCollectionVideos");
    });
  }

  const addVideoToCollection = () => {
    if (!selectedCollectionId || !collectionVideoIdInput.trim()) return;
    AppService.AddVideoToCollection(selectedCollectionId, collectionVideoIdInput.trim()).then(() => {
      setCollectionVideoIdInput("");
      loadCollectionVideos(selectedCollectionId);
    }).catch((err: any) => {
      reportError(err, "AddVideoToCollection");
    });
  }

  const removeVideoFromCollection = (videoId: string) => {
    if (!selectedCollectionId) return;
    AppService.RemoveVideoFromCollection(selectedCollectionId, videoId).then(() => {
      loadCollectionVideos(selectedCollectionId);
    }).catch((err: any) => {
      reportError(err, "RemoveVideoFromCollection");
    });
  }
  const saveTemplate = () => {
    if (!templateForm.name.trim() || !templateForm.prompt.trim()) return;
    AppService.SaveTemplate({
      Name: templateForm.name.trim(),
      Description: templateForm.description,
      Prompt: templateForm.prompt,
      Variables: templateForm.variables,
      IsDefault: templateForm.isDefault,
      CreatedBy: "user",
    }).then(() => {
      setTemplateForm({
        name: "",
        description: "",
        prompt: "",
        variables: `["text"]`,
        isDefault: false,
      });
      loadTemplates();
    }).catch((err: any) => {
      reportError(err, "SaveTemplate");
    });
  }

  const deleteTemplate = (name: string) => {
    if (!name) return;
    AppService.DeleteTemplate(name).then(() => {
      loadTemplates();
    }).catch((err: any) => {
      reportError(err, "DeleteTemplate");
    });
  }

  const syncChannelFromSettings = () => {
    if (!channelInput.trim()) {
      return;
    }
    setIsSyncing(true);
    AppService.SyncChannelFeed(channelInput.trim()).then(() => {
      setChannelInput("");
      loadChannels();
      loadVideos();
    }).catch((err: any) => {
      reportError(err, "SyncChannelFeed");
    }).finally(() => {
      setIsSyncing(false);
    });
  }

  const deleteChannel = (channelID: string) => {
    if (!channelID) return;
    AppService.DeleteChannel(channelID).then(() => {
      loadChannels();
      loadVideos();
    }).catch((err: any) => {
      reportError(err, "DeleteChannel");
    });
  }

  const searchVideosForCollection = () => {
    if (!collectionSearchQuery.trim()) {
      setCollectionSearchResults([]);
      return;
    }
    setIsSearchingCollections(true);
    AppService.ListVideos(12, 0, {
      ChannelID: "",
      TagID: 0,
      Query: collectionSearchQuery.trim(),
    }).then((items: any[]) => {
      setCollectionSearchResults(items || []);
    }).catch((err: any) => {
      reportError(err, "SearchVideos");
    }).finally(() => {
      setIsSearchingCollections(false);
    });
  }

  useEffect(() => {
    if (activeMenu === "Feed") {
      loadVideos();
    }
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu === "Settings") {
      loadChannels();
    }
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu === "Templates") {
      loadTemplates();
    }
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu === "Collector") {
      loadCollections();
    }
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu === "Tags") {
      loadTags();
    }
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu === "Feed") {
      loadCollections();
    }
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu === "Feed") {
      loadChannels();
      loadTags();
    }
  }, [activeMenu]);

  useEffect(() => {
    if (selectedVideo && templates.length === 0) {
      loadTemplates();
    }
  }, [selectedVideo, templates.length]);

  const renderContent = () => {
    switch (activeMenu) {
      case "Feed":
        return (
          <>
            <Card className="bg-card/70">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Feed Preview</CardTitle>
                  <CardDescription>{isLoadingVideos ? "Loading videos..." : "Latest videos from your saved feeds."}</CardDescription>
                  {feedNotice && (
                    <div className="mt-2 text-xs text-emerald-200">{feedNotice}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  className="text-xs text-muted-foreground hover:text-white"
                  onClick={loadVideos}
                >
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <Input
                    placeholder="Search title, summary, channel"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                  />
                  <select
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                    value={filterChannelId}
                    onChange={(e) => setFilterChannelId(e.target.value)}
                  >
                    <option value="">All Channels</option>
                    {channels.map((channel) => (
                      <option key={channel.ChannelID} value={channel.ChannelID}>
                        {channel.Name || channel.ChannelID}
                      </option>
                    ))}
                  </select>
                  <select
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                    value={filterTagId ?? ""}
                    onChange={(e) => setFilterTagId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">All Tags</option>
                    {tags.map((tag) => (
                      <option key={tag.ID} value={tag.ID}>
                        {tag.Name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Button variant="outline" className="h-10 px-4 text-sm" onClick={loadVideos}>
                      Apply
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-10 px-4 text-sm text-muted-foreground hover:text-white"
                      onClick={() => {
                        setFilterQuery("");
                        setFilterChannelId("");
                        setFilterTagId(null);
                        setTimeout(loadVideos, 0);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {videos.length === 0 && !isLoadingVideos && (
                  <div className="col-span-full rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                    No videos yet. Sync a channel to populate.
                  </div>
                )}
                {videos.map((video) => (
                  <div
                    key={video.VideoID}
                    className={`flex cursor-pointer flex-col gap-2 rounded-xl border border-border/60 bg-background/70 p-3 transition hover:border-white/20 hover:bg-white/5 ${
                      recentlySummarizedVideoId === video.VideoID ? "border-emerald-400/60 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]" : ""
                    }`}
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className={`rounded-full border px-2 py-0.5 ${
                        video.Transcript ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5"
                      }`}>Transcript</span>
                      {video.TranscriptStatus === "failed" && (
                        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-200">
                          Transcript Failed
                        </span>
                      )}
                      <span className={`rounded-full border px-2 py-0.5 ${
                        video.Summary ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200" : "border-white/10 bg-white/5"
                      }`}>Summary</span>
                    </div>
                    {video.Thumbnail && (
                      <img
                        src={video.Thumbnail}
                        alt={video.Title}
                        className="h-28 w-full rounded-lg object-cover"
                      />
                    )}
                    <div className="text-sm font-semibold leading-tight">{video.Title}</div>
                    <div className="text-xs text-muted-foreground">{video.ChannelName}</div>
                    {collections.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <select
                          className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
                          defaultValue=""
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!value) return;
                            AppService.AddVideoToCollection(Number(value), video.VideoID)
                              .then(() => {
                                setFeedNotice("Added to collection.");
                                setTimeout(() => setFeedNotice(""), 2000);
                                loadCollections();
                              })
                              .catch((err: any) => {
                                reportError(err, "AddVideoToCollection");
                                setFeedNotice("Failed to add to collection.");
                                setTimeout(() => setFeedNotice(""), 2000);
                              });
                            e.currentTarget.value = "";
                          }}
                        >
                          <option value="">Add to collection</option>
                          {collections.map((col) => (
                            <option key={col.ID} value={col.ID}>
                              {col.Name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {video.Summary && (
                      <div className="text-xs text-muted-foreground line-clamp-3">{video.Summary}</div>
                    )}
                    <div className="text-xs text-muted-foreground">{new Date(video.PublishedAt).toLocaleDateString()}</div>
                  </div>
                ))}
                </div>
              </CardContent>
            </Card>
            <Dialog
              open={Boolean(selectedVideo)}
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedVideo(null);
                  setSummaryExpanded(false);
                  setSummaryError("");
                  setDetailTab("summary");
                }
              }}
            >
              <DialogOverlay />
              <DialogContent>
                {selectedVideo && (
                  <>
                    <DialogHeader>
                      <DialogTitle>Video Detail</DialogTitle>
                      <DialogDescription>{selectedVideo.ChannelName}</DialogDescription>
                    </DialogHeader>
                    <div
                      className={`mt-4 grid gap-4 ${
                        selectedVideo.Thumbnail ? "grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)]" : "grid-cols-1"
                      }`}
                    >
                      {selectedVideo.Thumbnail && (
                        <img
                          src={selectedVideo.Thumbnail}
                          alt={selectedVideo.Title}
                          className="h-32 w-full rounded-lg object-cover"
                        />
                      )}
                      <div className="w-full min-w-0 space-y-2">
                        <div className="text-lg font-semibold">{selectedVideo.Title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(selectedVideo.PublishedAt).toLocaleString()}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedVideo.URL && (
                            <Button
                              variant="outline"
                              className="h-8 px-3 text-xs"
                              onClick={() => Browser.OpenURL(selectedVideo.URL)}
                            >
                              Open YouTube
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            onClick={summarizeSelected}
                            disabled={isSummarizing || (llmProvider === "openai" && !openAIKey)}
                          >
                            {isSummarizing ? "Summarizing..." : "Generate Summary"}
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            onClick={autoTagSelected}
                            disabled={llmProvider === "openai" && !openAIKey}
                          >
                            Auto Tag
                          </Button>
                        </div>
                        {summaryError && (
                          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">
                            {summaryError}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={detailTab === "summary" ? "default" : "outline"}
                            className="h-8 px-3 text-xs"
                            onClick={() => setDetailTab("summary")}
                          >
                            Summary
                          </Button>
                          <Button
                            variant={detailTab === "transcript" ? "default" : "outline"}
                            className="h-8 px-3 text-xs"
                            onClick={() => setDetailTab("transcript")}
                          >
                            Transcript
                          </Button>
                        </div>
                        {detailTab === "summary" ? (
                          selectedVideo.Summary ? (
                            <>
                              <div
                                className={`summary-block text-sm text-muted-foreground ${
                                  summaryExpanded ? "summary-expanded" : "summary-collapsed"
                                }`}
                              >
                                {selectedVideo.Summary}
                              </div>
                              <Button
                                variant="ghost"
                                className="h-8 px-2 text-xs text-muted-foreground hover:text-white"
                                onClick={() => setSummaryExpanded(!summaryExpanded)}
                              >
                                {summaryExpanded ? "Collapse" : "Expand"}
                              </Button>
                            </>
                          ) : (
                            <div className="text-sm text-muted-foreground">No summary yet.</div>
                          )
                        ) : selectedVideo.Transcript ? (
                          <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border/60 bg-background/70 p-3 text-sm text-muted-foreground">
                            {selectedVideo.Transcript}
                          </div>
                        ) : (
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div>No transcript yet. Generate summary to fetch transcript.</div>
                            {selectedVideo.TranscriptStatus === "failed" && (
                              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200">
                                Transcript fetch failed. It will retry on the next auto-summary cycle.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </>
        );
      case "Collector":
        return (
          <>
            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle>Collections</CardTitle>
                <CardDescription>Create and manage saved video collections.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Collection name"
                    value={collectionInput.name}
                    onChange={(e) => setCollectionInput({ ...collectionInput, name: e.target.value })}
                  />
                  <Input
                    placeholder="Description"
                    value={collectionInput.description}
                    onChange={(e) => setCollectionInput({ ...collectionInput, description: e.target.value })}
                  />
                </div>
                <Button variant="outline" className="h-9 px-4 text-sm" onClick={createCollection}>
                  Create Collection
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/70">
              <CardHeader>
                <CardTitle>Import / Export</CardTitle>
                <CardDescription>Share templates as JSON.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="h-9 px-4 text-sm"
                    onClick={() => {
                      AppService.ExportTemplates()
                        .then((raw: string) => {
                          setTemplateExportJSON(raw);
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(raw).catch(() => {});
                          }
                        })
                        .catch((err: any) => reportError(err, "ExportTemplates"));
                    }}
                  >
                    Export Templates
                  </Button>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={templateOverwrite}
                      onChange={(e) => setTemplateOverwrite(e.target.checked)}
                    />
                    Overwrite by name
                  </label>
                </div>
                {templateExportJSON && (
                  <textarea
                    className="min-h-[120px] w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                    readOnly
                    value={templateExportJSON}
                  />
                )}
                <textarea
                  className="min-h-[120px] w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                  placeholder="Paste template JSON to import"
                  value={templateImportJSON}
                  onChange={(e) => setTemplateImportJSON(e.target.value)}
                />
                <Button
                  variant="outline"
                  className="h-9 px-4 text-sm"
                  onClick={() => {
                    if (!templateImportJSON.trim()) return;
                    AppService.ImportTemplates(templateImportJSON, templateOverwrite)
                      .then(() => {
                        setTemplateImportJSON("");
                        loadTemplates();
                      })
                      .catch((err: any) => reportError(err, "ImportTemplates"));
                  }}
                >
                  Import Templates
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/70">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Saved Collections</CardTitle>
                  <CardDescription>
                    {isLoadingCollections ? "Loading collections..." : "Select a collection to view videos."}
                  </CardDescription>
                </div>
                <Button variant="ghost" className="text-xs" onClick={loadCollections}>
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {collections.length === 0 && !isLoadingCollections && (
                  <div className="col-span-full text-sm text-muted-foreground">No collections yet.</div>
                )}
                {collections.map((col) => (
                  <div
                    key={col.ID}
                    className={`rounded-xl border border-border/60 bg-background/70 p-3 ${
                      selectedCollectionId === col.ID ? "border-white/30" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold">{col.Name}</div>
                        <div className="text-xs text-muted-foreground">{col.Description}</div>
                        <div className="text-xs text-muted-foreground">{col.VideoCount} videos</div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-white"
                          onClick={() => {
                            setSelectedCollectionId(col.ID);
                            loadCollectionVideos(col.ID);
                          }}
                        >
                          Open
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-white"
                          onClick={() => deleteCollection(col.ID)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {selectedCollectionId && (
              <>
                <Card className="bg-card/70">
                  <CardHeader>
                    <CardTitle>Add Videos</CardTitle>
                    <CardDescription>Search saved videos and add them to this collection.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Input
                        className="min-w-[220px] flex-1"
                        placeholder="Search by title, channel, summary"
                        value={collectionSearchQuery}
                        onChange={(e) => setCollectionSearchQuery(e.target.value)}
                      />
                      <Button variant="outline" className="h-9 px-4 text-sm" onClick={searchVideosForCollection}>
                        {isSearchingCollections ? "Searching..." : "Search"}
                      </Button>
                    </div>
                    {collectionSearchResults.length > 0 && (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {collectionSearchResults.map((video) => (
                          <div
                            key={video.VideoID}
                            className="rounded-xl border border-border/60 bg-background/70 p-3"
                          >
                            <div className="text-sm font-semibold">{video.Title}</div>
                            <div className="text-xs text-muted-foreground">{video.ChannelName}</div>
                            <Button
                              variant="ghost"
                              className="mt-2 h-7 px-2 text-[11px] text-muted-foreground hover:text-white"
                              onClick={() => {
                                if (!selectedCollectionId) return;
                                AppService.AddVideoToCollection(selectedCollectionId, video.VideoID)
                                  .then(() => loadCollectionVideos(selectedCollectionId))
                                  .catch((err: any) => reportError(err, "AddVideoToCollection"));
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {collectionSearchQuery.trim() !== "" && collectionSearchResults.length === 0 && !isSearchingCollections && (
                      <div className="text-sm text-muted-foreground">No matching videos found.</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card/70">
                  <CardHeader>
                    <CardTitle>Collection Videos</CardTitle>
                    <CardDescription>Manage videos in this collection.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Input
                        className="min-w-[220px] flex-1"
                        placeholder="Video ID (e.g. dQw4w9WgXcQ)"
                        value={collectionVideoIdInput}
                        onChange={(e) => setCollectionVideoIdInput(e.target.value)}
                      />
                      <Button variant="outline" className="h-9 px-4 text-sm" onClick={addVideoToCollection}>
                        Add Video
                      </Button>
                    </div>
                    {collectionVideos.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No videos in this collection.</div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {collectionVideos.map((video) => (
                          <div
                            key={video.VideoID}
                            className="rounded-xl border border-border/60 bg-background/70 p-3"
                          >
                            <div className="text-sm font-semibold">{video.Title}</div>
                            <div className="text-xs text-muted-foreground">{video.ChannelName}</div>
                            <Button
                              variant="ghost"
                              className="mt-2 h-7 px-2 text-[11px] text-muted-foreground hover:text-white"
                              onClick={() => removeVideoFromCollection(video.VideoID)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        variant="outline"
                        className="h-9 px-4 text-sm"
                        onClick={() => selectedCollectionId && AppService.ExportCollectionMarkdown(selectedCollectionId)}
                      >
                        Export Markdown
                      </Button>
                      <Button
                        variant="outline"
                        className="h-9 px-4 text-sm"
                        onClick={() => selectedCollectionId && AppService.ExportCollectionPDF(selectedCollectionId)}
                      >
                        Export PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        );
      case "Templates":
        return (
          <>
            <Card className="bg-card/80">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Templates</CardTitle>
                  <CardDescription>Manage summary templates and variables.</CardDescription>
                </div>
                <Button variant="ghost" className="text-xs" onClick={loadTemplates}>
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Template name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  />
                  <Input
                    placeholder="Short description"
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  />
                </div>
                <Input
                  placeholder='Variables JSON (e.g. ["text","title"])'
                  value={templateForm.variables}
                  onChange={(e) => setTemplateForm({ ...templateForm, variables: e.target.value })}
                />
                <textarea
                  className="min-h-[140px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Prompt template"
                  value={templateForm.prompt}
                  onChange={(e) => setTemplateForm({ ...templateForm, prompt: e.target.value })}
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={templateForm.isDefault}
                    onChange={(e) => setTemplateForm({ ...templateForm, isDefault: e.target.checked })}
                  />
                  Set as default
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="h-9 px-4 text-sm" onClick={saveTemplate}>
                    Save Template
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-9 px-4 text-sm text-muted-foreground hover:text-white"
                    onClick={() => {
                      AppService.ResetDefaultTemplates()
                        .then(() => loadTemplates())
                        .catch((err: any) => reportError(err, "ResetDefaultTemplates"));
                    }}
                  >
                    Reset Default Templates
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/70">
              <CardHeader>
                <CardTitle>Saved Templates</CardTitle>
                <CardDescription>
                  {isLoadingTemplates ? "Loading templates..." : "Click delete to remove a template."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.length === 0 && !isLoadingTemplates && (
                  <div className="text-sm text-muted-foreground">No templates yet.</div>
                )}
                {templates.map((tpl) => (
                  <div
                    key={tpl.Name}
                    className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-background/70 p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="activeTemplate"
                          checked={selectedTemplate === tpl.Name}
                          onChange={() => setSelectedTemplate(tpl.Name)}
                        />
                        <div className="text-sm font-semibold">{tpl.Name}</div>
                        {tpl.IsDefault && (
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{tpl.Description}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-white"
                        onClick={() =>
                          setTemplateForm({
                            name: tpl.Name,
                            description: tpl.Description || "",
                            prompt: tpl.Prompt || "",
                            variables: tpl.Variables || `["text"]`,
                            isDefault: Boolean(tpl.IsDefault),
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-white"
                        onClick={() => deleteTemplate(tpl.Name)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        );
      case "Tags":
        return (
          <>
            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>Organize tags for faster filtering.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Tag name"
                    value={tagInput.name}
                    onChange={(e) => setTagInput({ ...tagInput, name: e.target.value })}
                  />
                  <Input
                    placeholder="Color (optional)"
                    value={tagInput.color}
                    onChange={(e) => setTagInput({ ...tagInput, color: e.target.value })}
                  />
                </div>
                <Button variant="outline" className="h-9 px-4 text-sm" onClick={createTag}>
                  Create Tag
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/70">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Saved Tags</CardTitle>
                  <CardDescription>
                    {isLoadingTags ? "Loading tags..." : "Select a tag to filter videos."}
                  </CardDescription>
                </div>
                <Button variant="ghost" className="text-xs" onClick={loadTags}>
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {tags.length === 0 && !isLoadingTags && (
                  <div className="col-span-full text-sm text-muted-foreground">No tags yet.</div>
                )}
                {tags.map((tag) => (
                  <div
                    key={tag.ID}
                    className={`rounded-xl border border-border/60 bg-background/70 p-3 ${
                      selectedTagId === tag.ID ? "border-white/30" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold">{tag.Name}</div>
                        <div className="text-xs text-muted-foreground">{tag.Color}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-white"
                          onClick={() => setSelectedTagId(tag.ID)}
                        >
                          Select
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-white"
                          onClick={() => deleteTag(tag.ID)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        );
      case "Settings":
        return (
          <>
            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>LLM, notifications, and app preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">LLM Provider</div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={llmProvider === "ollama" ? "default" : "outline"}
                      className="h-8 px-3 text-xs"
                      onClick={() => setLlmProvider("ollama")}
                    >
                      Ollama
                    </Button>
                    <Button
                      variant={llmProvider === "openai" ? "default" : "outline"}
                      className="h-8 px-3 text-xs"
                      onClick={() => setLlmProvider("openai")}
                    >
                      OpenAI
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Response Language</div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={responseLanguage === "ko" ? "default" : "outline"}
                      className="h-8 px-3 text-xs"
                      onClick={() => setResponseLanguage("ko")}
                    >
                      Korean
                    </Button>
                    <Button
                      variant={responseLanguage === "en" ? "default" : "outline"}
                      className="h-8 px-3 text-xs"
                      onClick={() => setResponseLanguage("en")}
                    >
                      English
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Ollama Base URL"
                    value={ollamaURL}
                    onChange={(e) => setOllamaURL(e.target.value)}
                  />
                  <Input
                    placeholder="OpenAI Model (e.g. gpt-4o-mini)"
                    value={openAIModel}
                    onChange={(e) => setOpenAIModel(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="OpenAI API Key"
                    value={openAIKey}
                    onChange={(e) => setOpenAIKey(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground">
                    API key is stored locally in this app.
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Auto Sync</div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={autoSyncEnabled}
                        onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                      />
                      Enable auto sync
                    </label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={1440}
                        className="w-32"
                        placeholder="Interval (min)"
                        value={syncIntervalMinutes}
                        onChange={(e) => setSyncIntervalMinutes(Number(e.target.value))}
                      />
                      <span className="text-xs text-muted-foreground">분</span>
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={notificationsEnabled}
                        onChange={(e) => setNotificationsEnabled(e.target.checked)}
                      />
                      Notifications
                    </label>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Auto sync checks all saved channels on the chosen interval.
                  </div>
                  <Button
                    variant="outline"
                    className="h-9 px-4 text-sm"
                    onClick={() => AppService.SyncAllChannels().catch((err: any) => reportError(err, "SyncAllChannels"))}
                  >
                    Sync Now
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Auto Summary</div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={autoSummaryEnabled}
                        onChange={(e) => setAutoSummaryEnabled(e.target.checked)}
                      />
                      Enable auto summary
                    </label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={1440}
                        className="w-32"
                        placeholder="Interval (min)"
                        value={summaryIntervalMinutes}
                        onChange={(e) => setSummaryIntervalMinutes(Number(e.target.value))}
                      />
                      <span className="text-xs text-muted-foreground">분</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        className="w-24"
                        placeholder="Batch"
                        value={summaryBatchSize}
                        onChange={(e) => setSummaryBatchSize(Number(e.target.value))}
                      />
                      <span className="text-xs text-muted-foreground">개</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Automatically summarizes pending videos on the chosen interval.
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Backup</div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="h-9 px-4 text-sm"
                      onClick={() => {
                        AppService.ExportBackup()
                          .then((res: any) => setBackupPath(res.BackupPath || ""))
                          .catch((err: any) => reportError(err, "ExportBackup"));
                      }}
                    >
                      Export Backup
                    </Button>
                    {backupPath && (
                      <div className="text-xs text-muted-foreground">Saved: {backupPath}</div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      className="min-w-[240px] flex-1"
                      placeholder="Backup zip path"
                      value={importPath}
                      onChange={(e) => setImportPath(e.target.value)}
                    />
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={restoreDB}
                        onChange={(e) => setRestoreDB(e.target.checked)}
                      />
                      Restore DB to .restore
                    </label>
                    <Button
                      variant="outline"
                      className="h-9 px-4 text-sm"
                      onClick={() => {
                        if (!importPath.trim()) return;
                        AppService.ImportBackup(importPath.trim(), restoreDB)
                          .then((res: any) => {
                            const msg = res.RestoredDB
                              ? `Imported. DB restored to ${res.RestoredDB}`
                              : "Imported backup settings/templates.";
                            setRestoreResult(msg);
                            loadTemplates();
                            loadTags();
                          })
                          .catch((err: any) => reportError(err, "ImportBackup"));
                      }}
                    >
                      Import Backup
                    </Button>
                  </div>
                  {restoreResult && (
                    <div className="text-xs text-muted-foreground">{restoreResult}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/70">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Channels</CardTitle>
                  <CardDescription>Manage watched YouTube channels.</CardDescription>
                </div>
                <Button variant="ghost" className="text-xs" onClick={loadChannels}>
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Input
                    className="min-w-[220px] flex-1"
                    placeholder="Channel ID (UC...)"
                    value={channelInput}
                    onChange={(e) => setChannelInput(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="h-10 px-4 text-sm"
                    onClick={syncChannelFromSettings}
                    disabled={isSyncing}
                  >
                    {isSyncing ? "Syncing..." : "Add & Sync"}
                  </Button>
                </div>

                {isLoadingChannels ? (
                  <div className="text-sm text-muted-foreground">Loading channels...</div>
                ) : channels.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No channels yet.</div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {channels.map((channel) => (
                      <div
                        key={channel.ChannelID}
                        className="rounded-xl border border-border/60 bg-background/70 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold">{channel.Name || channel.ChannelID}</div>
                            <div className="text-xs text-muted-foreground">{channel.ChannelID}</div>
                          </div>
                          <Button
                            variant="ghost"
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-white"
                            onClick={() => deleteChannel(channel.ChannelID)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="w-full border-b border-border/60 bg-sidebar text-sidebar-foreground p-4 md:w-56 md:border-b-0 md:border-r md:p-6 lg:w-64">
          <div className="flex flex-wrap items-center justify-between gap-4 md:flex-col md:items-start">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-sm font-semibold text-secondary-foreground">
                YT
              </div>
              <div>
                <div className="text-base font-semibold tracking-tight">YTFeedGenerator</div>
                <div className="text-xs text-muted-foreground">Summaries. Tags. Collections.</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground md:hidden">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">
                Backend: ok
              </span>
              <span className="tabular-nums">{time}</span>
            </div>
          </div>

          <nav className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-1 md:gap-2">
            {["Feed", "Collector", "Templates", "Tags", "Settings"].map((item) => (
              <Button
                key={item}
                variant={activeMenu === item ? "default" : "ghost"}
                className={`h-10 justify-start px-3 text-sm ${
                  activeMenu === item
                    ? "bg-white/10 text-white hover:bg-white/15"
                    : "text-muted-foreground hover:text-white"
                }`}
                onClick={() => setActiveMenu(item)}
              >
                {item}
              </Button>
            ))}
          </nav>

          <div className="mt-6 hidden space-y-2 text-xs text-muted-foreground md:block">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">
              Backend: ok
            </div>
            <div className="tabular-nums">{time}</div>
          </div>
        </aside>

        <main className="flex flex-1 flex-col gap-6 bg-background p-6 md:p-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-semibold tracking-tight">{activeMenu}</div>
              <div className="text-sm text-muted-foreground">Start by syncing a channel feed.</div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </Button>
              <Button variant="outline">New Collection</Button>
              <Button className="bg-white text-slate-900 hover:bg-white/90">
                Quick Sync
              </Button>
            </div>
          </header>

          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default App
