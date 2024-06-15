import type { HostComponent, NativeSyntheticEvent, ViewProps } from 'react-native';
import type ResizeMode from './types/ResizeMode';
import type FilterType from './types/FilterType';
import type Orientation from './types/Orientation';
import type { AdEvent, EnumValues, OnTextTracksTypeData } from './types';
type Headers = Record<string, string>;
type VideoSrc = Readonly<{
    uri?: string;
    isNetwork?: boolean;
    isAsset?: boolean;
    shouldCache?: boolean;
    type?: string;
    mainVer?: number;
    patchVer?: number;
    requestHeaders?: Headers;
    startPosition?: number;
    cropStart?: number;
    cropEnd?: number;
    title?: string;
    subtitle?: string;
    description?: string;
    customImageUri?: string;
}>;
export type Filter = 'None' | 'CIColorInvert' | 'CIColorMonochrome' | 'CIColorPosterize' | 'CIFalseColor' | 'CIMaximumComponent' | 'CIMinimumComponent' | 'CIPhotoEffectChrome' | 'CIPhotoEffectFade' | 'CIPhotoEffectInstant' | 'CIPhotoEffectMono' | 'CIPhotoEffectNoir' | 'CIPhotoEffectProcess' | 'CIPhotoEffectTonal' | 'CIPhotoEffectTransfer' | 'CISepiaTone';
export type DRMType = 'widevine' | 'playready' | 'clearkey' | 'fairplay';
type DebugConfig = Readonly<{
    enable?: boolean;
    thread?: boolean;
}>;
type Drm = Readonly<{
    type?: DRMType;
    licenseServer?: string;
    headers?: Headers;
    contentId?: string;
    certificateUrl?: string;
    base64Certificate?: boolean;
    useExternalGetLicense?: boolean;
}>;
type TextTracks = ReadonlyArray<Readonly<{
    title: string;
    language: string;
    type: string;
    uri: string;
}>>;
type TextTrackType = 'system' | 'disabled' | 'title' | 'language' | 'index';
type SelectedTextTrack = Readonly<{
    type: TextTrackType;
    value?: string | number;
}>;
type AudioTrackType = 'system' | 'disabled' | 'title' | 'language' | 'index';
type SelectedAudioTrack = Readonly<{
    type: AudioTrackType;
    value?: string | number;
}>;
export type Seek = Readonly<{
    time: number;
    tolerance?: number;
}>;
type BufferConfig = Readonly<{
    minBufferMs?: number;
    maxBufferMs?: number;
    bufferForPlaybackMs?: number;
    bufferForPlaybackAfterRebufferMs?: number;
    maxHeapAllocationPercent?: number;
    minBackBufferMemoryReservePercent?: number;
    minBufferMemoryReservePercent?: number;
}>;
type SelectedVideoTrack = Readonly<{
    type: 'auto' | 'disabled' | 'resolution' | 'index';
    value?: number;
}>;
type SubtitleStyle = Readonly<{
    fontSize?: number;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
}>;
export type OnLoadData = Readonly<{
    currentTime: number;
    duration: number;
    naturalSize: Readonly<{
        width: number;
        height: number;
        orientation: Orientation;
    }>;
}> & OnAudioTracksData & OnTextTracksData;
export type OnLoadStartData = Readonly<{
    isNetwork: boolean;
    type: string;
    uri: string;
}>;
export type OnVideoAspectRatioData = Readonly<{
    width: number;
    height: number;
}>;
export type OnBufferData = Readonly<{
    isBuffering: boolean;
}>;
export type OnProgressData = Readonly<{
    currentTime: number;
    playableDuration: number;
    seekableDuration: number;
}>;
export type OnBandwidthUpdateData = Readonly<{
    bitrate: number;
    width?: number;
    height?: number;
    trackId?: number;
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
export type OnAudioTracksData = Readonly<{
    audioTracks: ReadonlyArray<Readonly<{
        index: number;
        title?: string;
        language?: string;
        bitrate?: number;
        type?: string;
        selected?: boolean;
    }>>;
}>;
export type OnTextTracksData = Readonly<{
    textTracks: ReadonlyArray<Readonly<{
        index: number;
        title?: string;
        language?: string;
        /**
         * iOS only supports VTT, Android supports all 3
         */
        type?: OnTextTracksTypeData;
        selected?: boolean;
    }>>;
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
export type onVolumeChangeData = Readonly<{
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
export interface VideoNativeProps extends ViewProps {
    src?: VideoSrc;
    drm?: Drm;
    adTagUrl?: string;
    allowsExternalPlayback?: boolean;
    maxBitRate?: number;
    resizeMode?: EnumValues<ResizeMode>;
    repeat?: boolean;
    automaticallyWaitsToMinimizeStalling?: boolean;
    textTracks?: TextTracks;
    selectedTextTrack?: SelectedTextTrack;
    selectedAudioTrack?: SelectedAudioTrack;
    paused?: boolean;
    muted?: boolean;
    controls?: boolean;
    filter?: EnumValues<FilterType>;
    filterEnabled?: boolean;
    volume?: number;
    playInBackground?: boolean;
    preventsDisplaySleepDuringVideoPlayback?: boolean;
    preferredForwardBufferDuration?: number;
    playWhenInactive?: boolean;
    pictureInPicture?: boolean;
    ignoreSilentSwitch?: 'inherit' | 'ignore' | 'obey';
    mixWithOthers?: 'inherit' | 'mix' | 'duck';
    rate?: number;
    fullscreen?: boolean;
    fullscreenAutorotate?: boolean;
    fullscreenOrientation?: 'all' | 'landscape' | 'portrait';
    progressUpdateInterval?: number;
    restoreUserInterfaceForPIPStopCompletionHandler?: boolean;
    localSourceEncryptionKeyScheme?: string;
    debug?: DebugConfig;
    backBufferDurationMs?: number;
    bufferConfig?: BufferConfig;
    contentStartTime?: number;
    currentPlaybackTime?: number;
    disableDisconnectError?: boolean;
    focusable?: boolean;
    hideShutterView?: boolean;
    minLoadRetryCount?: number;
    reportBandwidth?: boolean;
    selectedVideoTrack?: SelectedVideoTrack;
    subtitleStyle?: SubtitleStyle;
    trackId?: string;
    useTextureView?: boolean;
    useSecureView?: boolean;
    onVideoLoad?: (event: NativeSyntheticEvent<OnLoadData>) => void;
    onVideoLoadStart?: (event: NativeSyntheticEvent<OnLoadStartData>) => void;
    onVideoAspectRatio?: (event: NativeSyntheticEvent<OnVideoAspectRatioData>) => void;
    onVideoBuffer?: (event: NativeSyntheticEvent<OnBufferData>) => void;
    onVideoError?: (event: NativeSyntheticEvent<OnVideoErrorData>) => void;
    onVideoProgress?: (event: NativeSyntheticEvent<OnProgressData>) => void;
    onVideoBandwidthUpdate?: (event: NativeSyntheticEvent<OnBandwidthUpdateData>) => void;
    onVideoSeek?: (event: NativeSyntheticEvent<OnSeekData>) => void;
    onVideoEnd?: (event: NativeSyntheticEvent<Readonly<object>>) => void;
    onVideoAudioBecomingNoisy?: (event: NativeSyntheticEvent<Readonly<object>>) => void;
    onVideoFullscreenPlayerWillPresent?: (event: NativeSyntheticEvent<Readonly<object>>) => void;
    onVideoFullscreenPlayerDidPresent?: (event: NativeSyntheticEvent<Readonly<object>>) => void;
    onVideoFullscreenPlayerWillDismiss?: (event: NativeSyntheticEvent<Readonly<object>>) => void;
    onVideoFullscreenPlayerDidDismiss?: (event: NativeSyntheticEvent<Readonly<object>>) => void;
    onReadyForDisplay?: (event: NativeSyntheticEvent<Readonly<object>>) => void;
    onPlaybackRateChange?: (event: NativeSyntheticEvent<OnPlaybackData>) => void;
    onVolumeChange?: (event: NativeSyntheticEvent<onVolumeChangeData>) => void;
    onVideoExternalPlaybackChange?: (event: NativeSyntheticEvent<OnExternalPlaybackChangeData>) => void;
    onGetLicense?: (event: NativeSyntheticEvent<OnGetLicenseData>) => void;
    onPictureInPictureStatusChanged?: (event: NativeSyntheticEvent<OnPictureInPictureStatusChangedData>) => void;
    onRestoreUserInterfaceForPictureInPictureStop?: (event: NativeSyntheticEvent<Readonly<object>>) => void;
    onReceiveAdEvent?: (event: NativeSyntheticEvent<OnReceiveAdEventData>) => void;
    onVideoPlaybackStateChanged?: (event: NativeSyntheticEvent<OnPlaybackStateChangedData>) => void;
    onVideoIdle?: (event: NativeSyntheticEvent<object>) => void;
    onAudioFocusChanged?: (event: NativeSyntheticEvent<OnAudioFocusChangedData>) => void;
    onTimedMetadata?: (event: NativeSyntheticEvent<OnTimedMetadataData>) => void;
    onAudioTracks?: (event: NativeSyntheticEvent<OnAudioTracksData>) => void;
    onTextTracks?: (event: NativeSyntheticEvent<OnTextTracksData>) => void;
    onVideoTracks?: (event: NativeSyntheticEvent<OnVideoTracksData>) => void;
}
export type VideoComponentType = HostComponent<VideoNativeProps>;
export type VideoSaveData = {
    uri: string;
};
export interface VideoManagerType {
    save: (option: object, reactTag: number) => Promise<VideoSaveData>;
    setPlayerPauseState: (paused: boolean, reactTag: number) => Promise<void>;
    setLicenseResult: (result: string, licenseUrl: string, reactTag: number) => Promise<void>;
    setLicenseResultError: (error: string, licenseUrl: string, reactTag: number) => Promise<void>;
}
export interface VideoDecoderPropertiesType {
    getWidevineLevel: () => Promise<number>;
    isCodecSupported: (mimeType: string, width: number, height: number) => Promise<'unsupported' | 'hardware' | 'software'>;
    isHEVCSupported: () => Promise<'unsupported' | 'hardware' | 'software'>;
}
export declare const VideoManager: VideoManagerType;
export declare const VideoDecoderProperties: VideoDecoderPropertiesType;
declare const _default: VideoComponentType;
export default _default;
