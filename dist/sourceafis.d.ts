export interface ImageOptions {
    dpi?: number | null;
}
export type SourceAfisClasses = {
    FingerprintImageOptions: any;
    FingerprintImage: any;
    FingerprintTemplate: any;
    FingerprintMatcher: any;
    FingerprintCompatibility: any;
    FingerprintTransparency: any;
    FileOutputStream: any;
};
export declare function _getClasses(): SourceAfisClasses;
export declare function imageFromEncoded(imageBuffer: Uint8Array, options?: ImageOptions): any;
export declare function imageFromRaw(width: number, height: number, rawBuffer: Uint8Array, options?: ImageOptions): any;
export declare function templateFromImage(imageOrBuffer: unknown | Uint8Array, options?: ImageOptions): any | Uint8Array;
export declare function templateFromEncoded(imageBuffer: Uint8Array, options?: ImageOptions): Uint8Array;
export declare function templateFromRaw(width: number, height: number, rawBuffer: Uint8Array, options?: ImageOptions): Uint8Array;
export declare function serializeTemplate(template: any): Uint8Array;
export declare function templateFromBytes(templateBuffer: Uint8Array): any;
export declare function importTemplate(templateBuffer: Uint8Array): any;
export declare function createMatcher(templateOrBytes: unknown | Uint8Array): any;
export declare function matchWithMatcher(matcher: any, candidateTemplateOrBytes: unknown | Uint8Array): number;
export declare function matchTemplates(probeTemplate: Uint8Array, candidateTemplate: Uint8Array): number;
export declare function matchImages(probeImage: Uint8Array, candidateImage: Uint8Array, options?: ImageOptions): number;
