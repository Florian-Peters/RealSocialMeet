import type Orientation from './Orientation';
import type { AdEvent } from './Ads';
export type OnLoadData = Readonly<{
    currentTime: number;
    duration: number;
    naturalSize: Readonly<{
        width: number;
        height: number;
        orientation: Orientation;
    }>;
}> & OnAudioTracksData & OnTextTracksData;
export type OnVideoAspectRatioData = Readonly<{
    width: number;
    height: number;
}>;
export type OnLoadStartData = Readonly<{
    isNetwork: boolean;
    type: string;
    uri: string;
}>;
export type OnProgressData = Readonly<{
    currentTime: number;
    playableDuration: number;
    seekableDuration: number;
}>;
export type OnSeekData = Readonly<{
    currentTime: number;
    seekTime: number;
}>;
export type OnPlaybackStateChangedData = Readonly<{
    isPlaying: boolean;
}>;
export type OnTimedMetadataData = Readonly<{
    metadata: ReadonlyArray<Readonly<{
        value?: string;
        identifier: string;
    }>>;
}>;
export type AudioTrack = Readonly<{
    index: number;
    title?: string;
    language?: string;
    bitrate?: number;
    type?: string;
    selected?: boolean;
}>;
export type OnAudioTracksData = Readonly<{
    audioTracks: ReadonlyArray<AudioTrack>;
}>;
export declare enum OnTextTracksTypeData {
    SRT = "srt",
    TTML = "ttml",
    VTT = "vtt"
}
export type TextTrack = Readonly<{
    index: number;
    title?: string;
    language?: string;
    type?: OnTextTracksTypeData;
    selected?: boolean;
}>;
export type OnTextTracksData = Readonly<{
    textTracks: ReadonlyArray<TextTrack>;
}>;
export type OnVideoTracksData = Readonly<{
    videoTracks: ReadonlyArray<Readonly<{
        trackId: number;
        codecs?: string;
        width?: number;
        height?: number;
        bitrate?: number;
        selected?: boolean;
    }>>;
}>;
export type OnPlaybackData = Readonly<{
    playbackRate: number;
}>;
export type OnVolumeChangeData = Readonly<{
    volume: number;
}>;
export type OnExternalPlaybackChangeData = Readonly<{
    isExternalPlaybackActive: boolean;
}>;
export type OnGetLicenseData = Readonly<{
    licenseUrl: string;
    contentId: string;
    spcBase64: string;
}>;
export type OnPictureInPictureStatusChangedData = Readonly<{
    isActive: boolean;
}>;
export type OnReceiveAdEventData = Readonly<{
    data?: Record<string, string>;
    event: AdEvent;
}>;
export type OnVideoErrorData = Readonly<{
    error: OnVideoErrorDataDetails;
    target?: number;
}>;
export type OnVideoErrorDataDetails = Readonly<{
    errorString?: string;
    errorException?: string;
    errorStackTrace?: string;
    errorCode?: string;
    error?: string;
    code?: number;
    localizedDescription?: string;
    localizedFailureReason?: string;
    localizedRecoverySuggestion?: string;
    domain?: string;
}>;
export type OnAudioFocusChangedData = Readonly<{
    hasAudioFocus: boolean;
}>;
export type OnBufferData = Readonly<{
    isBuffering: boolean;
}>;
export type OnBandwidthUpdateData = Readonly<{
    bitrate: number;
    width: number;
    height: number;
    trackId: number;
} | {
    bitrate: number;
}>;
export interface ReactVideoEvents {
    onAudioBecomingNoisy?: () => void;
    onAudioFocusChanged?: (e: OnAudioFocusChangedData) => void;
    onIdle?: () => void;
    onBandwidthUpdate?: (e: OnBandwidthUpdateData) => void;
    onBuffer?: (e: OnBufferData) => void;
    onEnd?: () => void;
    onError?: (e: OnVideoErrorData) => void;
    onExternalPlaybackChange?: (e: OnExternalPlaybackChangeData) => void;
    onFullscreenPlayerWillPresent?: () => void;
    onFullscreenPlayerDidPresent?: () => void;
    onFullscreenPlayerWillDismiss?: () => void;
    onFullscreenPlayerDidDismiss?: () => void;
    onLoad?: (e: OnLoadData) => void;
    onLoadStart?: (e: OnLoadStartData) => void;
    onPictureInPictureStatusChanged?: (e: OnPictureInPictureStatusChangedData) => void;
    onPlaybackRateChange?: (e: OnPlaybackData) => void;
    onVolumeChange?: (e: OnVolumeChangeData) => void;
    onProgress?: (e: OnProgressData) => void;
    onReadyForDisplay?: () => void;
    onReceiveAdEvent?: (e: OnReceiveAdEventData) => void;
    onRestoreUserInterfaceForPictureInPictureStop?: () => void;
    onSeek?: (e: OnSeekData) => void;
    onPlaybackStateChanged?: (e: OnPlaybackStateChangedData) => void;
    onTimedMetadata?: (e: OnTimedMetadataData) => void;
    onAudioTracks?: (e: OnAudioTracksData) => void;
    onTextTracks?: (e: OnTextTracksData) => void;
    onVideoTracks?: (e: OnVideoTracksData) => void;
    onAspectRatio?: (e: OnVideoAspectRatioData) => void;
}
