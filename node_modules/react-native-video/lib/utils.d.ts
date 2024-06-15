import type { Component, RefObject, ComponentClass } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { ReactVideoSource, ReactVideoSourceProperties } from './types/video';
type Source = ImageSourcePropType | ReactVideoSource;
export declare function resolveAssetSourceForVideo(source: Source): ReactVideoSourceProperties;
export declare function getReactTag(ref: RefObject<Component<unknown, unknown, unknown> | ComponentClass<unknown, unknown> | null>): number;
export {};
