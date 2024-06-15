import { Image, findNodeHandle } from 'react-native';
export function resolveAssetSourceForVideo(source) {
    if (typeof source === 'number') {
        return {
            uri: Image.resolveAssetSource(source).uri,
        };
    }
    return source;
}
export function getReactTag(ref) {
    if (!ref.current) {
        throw new Error('Video Component is not mounted');
    }
    const reactTag = findNodeHandle(ref.current);
    if (!reactTag) {
        throw new Error('Cannot find reactTag for Video Component in components tree');
    }
    return reactTag;
}
//# sourceMappingURL=utils.js.map