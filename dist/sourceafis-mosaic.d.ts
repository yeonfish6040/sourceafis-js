import { ImageOptions } from "./sourceafis";
export type MinutiaType = "ending" | "bifurcation";
export interface MinutiaPoint {
    x: number;
    y: number;
    direction: number;
    type: MinutiaType;
}
export interface MosaicTemplate {
    width: number;
    height: number;
    minutiae: MinutiaPoint[];
}
export interface MosaicTransform {
    rotation: number;
    cos: number;
    sin: number;
    tx: number;
    ty: number;
}
export interface MosaicOptions {
    mergeMatched?: "probe" | "candidate" | "average";
    includeUnmatched?: boolean;
}
export interface MosaicResult {
    template: MosaicTemplate;
    transform: MosaicTransform;
    pairs: Array<{
        probe: number;
        candidate: number;
    }>;
    score: number;
}
export interface ImageMergeOptions {
    alpha?: number;
    backgroundThreshold?: number;
}
export declare function mosaicFromTemplates(probeTemplate: any | Uint8Array, candidateTemplate: any | Uint8Array, options?: MosaicOptions): MosaicResult;
export declare function mosaicFromImages(probeImage: Uint8Array, candidateImage: Uint8Array, imageOptions?: ImageOptions, options?: MosaicOptions): MosaicResult;
export declare function mosaicImages(probePng: Uint8Array, candidatePng: Uint8Array, transform: MosaicTransform, options?: ImageMergeOptions): Uint8Array;
