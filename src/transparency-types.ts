export type JavaClass<T = any> = {
  new (...args: any[]): T;
  [key: string]: any;
};

export type JavaObject = { [key: string]: any };


export type TransparencyCoreClasses = {
  PlainTransparencyArchive: JavaClass;
  PredicateTransparencyFilter: JavaClass;
  TransparencyArchive: JavaClass;
  TransparencyBuffer: JavaClass;
  TransparencyBufferLogger: JavaClass;
  TransparencyFilter: JavaClass;
  TransparencyKey: JavaClass;
  TransparencyKeys: JavaClass;
  TransparencyRecord: JavaClass;
  TransparentOperation: JavaClass;
};

export type TransparencyKeysClasses = {
  AbsoluteContrastMaskKey: JavaClass;
  BestMatchKey: JavaClass;
  BestPairingKey: JavaClass;
  BestScoreKey: JavaClass;
  BinarizedImageKey: JavaClass;
  BinarizedSkeletonKey: JavaClass;
  BlockOrientationKey: JavaClass;
  BlocksKey: JavaClass;
  CandidateGrayscaleKey: JavaClass;
  CandidateImageKey: JavaClass;
  CandidateTemplateKey: JavaClass;
  CombinedMaskKey: JavaClass;
  ContextKey: JavaClass;
  ContrastKey: JavaClass;
  DecodedImageKey: JavaClass;
  EdgeHashKey: JavaClass;
  EdgeTableKey: JavaClass;
  EncodedImageKey: JavaClass;
  EqualizedImageKey: JavaClass;
  FilteredBinaryImageKey: JavaClass;
  FilteredMaskKey: JavaClass;
  HistogramKey: JavaClass;
  InnerMaskKey: JavaClass;
  InnerMinutiaeKey: JavaClass;
  InputGrayscaleKey: JavaClass;
  InputImageKey: JavaClass;
  InputTemplateKey: JavaClass;
  OrthogonalSmoothingKey: JavaClass;
  OutputScoreKey: JavaClass;
  OutputTemplateKey: JavaClass;
  PairingKey: JavaClass;
  ParallelSmoothingKey: JavaClass;
  PixelMaskKey: JavaClass;
  PixelwiseOrientationKey: JavaClass;
  ProbeGrayscaleKey: JavaClass;
  ProbeImageKey: JavaClass;
  ProbeTemplateKey: JavaClass;
  RelativeContrastMaskKey: JavaClass;
  RemovedDotsKey: JavaClass;
  RemovedFragmentsKey: JavaClass;
  RemovedGapsKey: JavaClass;
  RemovedMinutiaCloudsKey: JavaClass;
  RemovedPoresKey: JavaClass;
  RemovedTailsKey: JavaClass;
  RootsKey: JavaClass;
  ScaledImageKey: JavaClass;
  ScoreKey: JavaClass;
  SerializedObjectKey: JavaClass;
  ShuffledMinutiaeKey: JavaClass;
  SideGrayscaleKey: JavaClass;
  SideImageKey: JavaClass;
  SideKey: JavaClass;
  SideTemplateKey: JavaClass;
  SkeletonKey: JavaClass;
  SkeletonMinutiaeKey: JavaClass;
  SmoothedHistogramKey: JavaClass;
  SmoothedOrientationKey: JavaClass;
  ThinnedSkeletonKey: JavaClass;
  TopMinutiaeKey: JavaClass;
  TracedSkeletonKey: JavaClass;
  UnknownTransparencyKey: JavaClass;
  VersionKey: JavaClass;
};

export type TransparencyTypesClasses = {
  Angle: JavaClass;
  BlockGrid: JavaClass;
  BlockMap: JavaClass;
  BooleanMatrix: JavaClass;
  ByteMatrix: JavaClass;
  DoubleAngles: JavaClass;
  DoubleMatrix: JavaClass;
  DoublePoint: JavaClass;
  DoublePointMatrix: JavaClass;
  EdgeHashEntry: JavaClass;
  EdgePair: JavaClass;
  EdgeShape: JavaClass;
  FloatAngles: JavaClass;
  HistogramCube: JavaClass;
  IndexedEdge: JavaClass;
  IntPoint: JavaClass;
  IntRect: JavaClass;
  MatchSide: JavaClass;
  MinutiaPair: JavaClass;
  MinutiaPoint: JavaClass;
  MinutiaType: JavaClass;
  NeighborEdge: JavaClass;
  OrientationAngle: JavaClass;
  PairingGraph: JavaClass;
  PersistentTemplate: JavaClass;
  ScoreBreakdown: JavaClass;
  SkeletonGraph: JavaClass;
  SkeletonRidge: JavaClass;
  SkeletonType: JavaClass;
  Template: JavaClass;
};

export type TransparencyUtilsClasses = {
  CborUtils: JavaClass;
};

export type TransparencyClasses = {
  core: TransparencyCoreClasses;
  keys: TransparencyKeysClasses;
  types: TransparencyTypesClasses;
  utils: TransparencyUtilsClasses;
};
