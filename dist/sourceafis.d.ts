export interface ImageOptions {
    dpi?: number | null;
}
export type SourceAfisClasses = {
    FingerprintImageOptions: any;
    FingerprintImage: any;
    FingerprintTemplate: any;
    FingerprintMatcher: any;
    FingerprintCompatibility: any;
    FileOutputStream: any;
};
export declare function imageFromEncoded(imageBuffer: Buffer, options?: ImageOptions): any;
export declare function imageFromRaw(width: number, height: number, rawBuffer: Buffer, options?: ImageOptions): any;
export declare function templateFromImage(imageOrBuffer: unknown | Buffer, options?: ImageOptions): any | Buffer;
export declare function templateFromEncoded(imageBuffer: Buffer, options?: ImageOptions): Buffer;
export declare function templateFromRaw(width: number, height: number, rawBuffer: Buffer, options?: ImageOptions): Buffer;
export declare function serializeTemplate(template: any): Buffer;
export declare function templateFromBytes(templateBuffer: Buffer): any;
export declare function importTemplate(templateBuffer: Buffer): any;
export declare function createMatcher(templateOrBytes: unknown | Buffer): any;
export declare function matchWithMatcher(matcher: any, candidateTemplateOrBytes: unknown | Buffer): number;
export declare function matchTemplates(probeTemplate: Buffer, candidateTemplate: Buffer): number;
export declare function matchImages(probeImage: Buffer, candidateImage: Buffer, options?: ImageOptions): number;
