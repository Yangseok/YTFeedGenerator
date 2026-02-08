import { Call } from "@wailsio/runtime";

const call = (method: string, ...args: any[]) => Call.ByName(method, ...args);

export const AppService = {
  ListVideos: (limit: number, offset: number, filter: any) =>
    call("AppService.ListVideos", limit, offset, filter),
  GetAppSettings: () => call("AppService.GetAppSettings"),
  SaveAppSettings: (input: any) => call("AppService.SaveAppSettings", input),
  LogClientError: (message: string) => call("AppService.LogClientError", message),
  GetSyncSettings: () => call("AppService.GetSyncSettings"),
  UpdateSyncSettings: (input: any) => call("AppService.UpdateSyncSettings", input),
  SyncAllChannels: () => call("AppService.SyncAllChannels"),
  SummarizeVideo: (
    videoID: string,
    templateName: string,
    provider: string,
    model: string,
    baseURL: string,
    apiKey: string,
    temperature: number
  ) =>
    call(
      "AppService.SummarizeVideo",
      videoID,
      templateName,
      provider,
      model,
      baseURL,
      apiKey,
      temperature
    ),
  ListChannels: () => call("AppService.ListChannels"),
  SyncChannelFeed: (channelID: string) => call("AppService.SyncChannelFeed", channelID),
  DeleteChannel: (channelID: string) => call("AppService.DeleteChannel", channelID),
  ListTemplates: () => call("AppService.ListTemplates"),
  SaveTemplate: (input: any) => call("AppService.SaveTemplate", input),
  DeleteTemplate: (name: string) => call("AppService.DeleteTemplate", name),
  ResetDefaultTemplates: () => call("AppService.ResetDefaultTemplates"),
  ListCollections: () => call("AppService.ListCollections"),
  CreateCollection: (input: any) => call("AppService.CreateCollection", input),
  DeleteCollection: (id: number) => call("AppService.DeleteCollection", id),
  ListCollectionVideos: (collectionID: number) => call("AppService.ListCollectionVideos", collectionID),
  AddVideoToCollection: (collectionID: number, videoID: string) =>
    call("AppService.AddVideoToCollection", collectionID, videoID),
  RemoveVideoFromCollection: (collectionID: number, videoID: string) =>
    call("AppService.RemoveVideoFromCollection", collectionID, videoID),
  ExportCollectionMarkdown: (collectionID: number) => call("AppService.ExportCollectionMarkdown", collectionID),
  ExportCollectionPDF: (collectionID: number) => call("AppService.ExportCollectionPDF", collectionID),
  ListTags: () => call("AppService.ListTags"),
  CreateTag: (input: any) => call("AppService.CreateTag", input),
  DeleteTag: (id: number) => call("AppService.DeleteTag", id),
  AddTagToVideo: (videoID: string, tagID: number) => call("AppService.AddTagToVideo", videoID, tagID),
  RemoveTagFromVideo: (videoID: string, tagID: number) => call("AppService.RemoveTagFromVideo", videoID, tagID),
  ExportTemplates: () => call("AppService.ExportTemplates"),
  ImportTemplates: (raw: string, overwrite: boolean) => call("AppService.ImportTemplates", raw, overwrite),
  AutoTagVideo: (
    videoID: string,
    provider: string,
    model: string,
    baseURL: string,
    apiKey: string,
    temperature: number
  ) =>
    call("AppService.AutoTagVideo", videoID, provider, model, baseURL, apiKey, temperature),
  ExportBackup: () => call("AppService.ExportBackup"),
  ImportBackup: (path: string, restoreDB: boolean) => call("AppService.ImportBackup", path, restoreDB),
};
