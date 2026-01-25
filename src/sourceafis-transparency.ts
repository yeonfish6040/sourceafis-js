import { _getClasses } from "./sourceafis";
import type { TransparencyClasses } from "./transparency-types";

const java: any = require("java");


let transparencyClasses: TransparencyClasses | null = null;


export function getTransparencyClasses(): TransparencyClasses {
  if (!transparencyClasses) {
    _getClasses();
    transparencyClasses = {

    core: {
      PlainTransparencyArchive: java.import("com.machinezoo.sourceafis.transparency.PlainTransparencyArchive"),
      PredicateTransparencyFilter: java.import("com.machinezoo.sourceafis.transparency.PredicateTransparencyFilter"),
      TransparencyArchive: java.import("com.machinezoo.sourceafis.transparency.TransparencyArchive"),
      TransparencyBuffer: java.import("com.machinezoo.sourceafis.transparency.TransparencyBuffer"),
      TransparencyBufferLogger: java.import("com.machinezoo.sourceafis.transparency.TransparencyBufferLogger"),
      TransparencyFilter: java.import("com.machinezoo.sourceafis.transparency.TransparencyFilter"),
      TransparencyKey: java.import("com.machinezoo.sourceafis.transparency.TransparencyKey"),
      TransparencyKeys: java.import("com.machinezoo.sourceafis.transparency.TransparencyKeys"),
      TransparencyRecord: java.import("com.machinezoo.sourceafis.transparency.TransparencyRecord"),
      TransparentOperation: java.import("com.machinezoo.sourceafis.transparency.TransparentOperation"),
    },
    keys: {
      AbsoluteContrastMaskKey: java.import("com.machinezoo.sourceafis.transparency.keys.AbsoluteContrastMaskKey"),
      BestMatchKey: java.import("com.machinezoo.sourceafis.transparency.keys.BestMatchKey"),
      BestPairingKey: java.import("com.machinezoo.sourceafis.transparency.keys.BestPairingKey"),
      BestScoreKey: java.import("com.machinezoo.sourceafis.transparency.keys.BestScoreKey"),
      BinarizedImageKey: java.import("com.machinezoo.sourceafis.transparency.keys.BinarizedImageKey"),
      BinarizedSkeletonKey: java.import("com.machinezoo.sourceafis.transparency.keys.BinarizedSkeletonKey"),
      BlockOrientationKey: java.import("com.machinezoo.sourceafis.transparency.keys.BlockOrientationKey"),
      BlocksKey: java.import("com.machinezoo.sourceafis.transparency.keys.BlocksKey"),
      CandidateGrayscaleKey: java.import("com.machinezoo.sourceafis.transparency.keys.CandidateGrayscaleKey"),
      CandidateImageKey: java.import("com.machinezoo.sourceafis.transparency.keys.CandidateImageKey"),
      CandidateTemplateKey: java.import("com.machinezoo.sourceafis.transparency.keys.CandidateTemplateKey"),
      CombinedMaskKey: java.import("com.machinezoo.sourceafis.transparency.keys.CombinedMaskKey"),
      ContextKey: java.import("com.machinezoo.sourceafis.transparency.keys.ContextKey"),
      ContrastKey: java.import("com.machinezoo.sourceafis.transparency.keys.ContrastKey"),
      DecodedImageKey: java.import("com.machinezoo.sourceafis.transparency.keys.DecodedImageKey"),
      EdgeHashKey: java.import("com.machinezoo.sourceafis.transparency.keys.EdgeHashKey"),
      EdgeTableKey: java.import("com.machinezoo.sourceafis.transparency.keys.EdgeTableKey"),
      EncodedImageKey: java.import("com.machinezoo.sourceafis.transparency.keys.EncodedImageKey"),
      EqualizedImageKey: java.import("com.machinezoo.sourceafis.transparency.keys.EqualizedImageKey"),
      FilteredBinaryImageKey: java.import("com.machinezoo.sourceafis.transparency.keys.FilteredBinaryImageKey"),
      FilteredMaskKey: java.import("com.machinezoo.sourceafis.transparency.keys.FilteredMaskKey"),
      HistogramKey: java.import("com.machinezoo.sourceafis.transparency.keys.HistogramKey"),
      InnerMaskKey: java.import("com.machinezoo.sourceafis.transparency.keys.InnerMaskKey"),
      InnerMinutiaeKey: java.import("com.machinezoo.sourceafis.transparency.keys.InnerMinutiaeKey"),
      InputGrayscaleKey: java.import("com.machinezoo.sourceafis.transparency.keys.InputGrayscaleKey"),
      InputImageKey: java.import("com.machinezoo.sourceafis.transparency.keys.InputImageKey"),
      InputTemplateKey: java.import("com.machinezoo.sourceafis.transparency.keys.InputTemplateKey"),
      OrthogonalSmoothingKey: java.import("com.machinezoo.sourceafis.transparency.keys.OrthogonalSmoothingKey"),
      OutputScoreKey: java.import("com.machinezoo.sourceafis.transparency.keys.OutputScoreKey"),
      OutputTemplateKey: java.import("com.machinezoo.sourceafis.transparency.keys.OutputTemplateKey"),
      PairingKey: java.import("com.machinezoo.sourceafis.transparency.keys.PairingKey"),
      ParallelSmoothingKey: java.import("com.machinezoo.sourceafis.transparency.keys.ParallelSmoothingKey"),
      PixelMaskKey: java.import("com.machinezoo.sourceafis.transparency.keys.PixelMaskKey"),
      PixelwiseOrientationKey: java.import("com.machinezoo.sourceafis.transparency.keys.PixelwiseOrientationKey"),
      ProbeGrayscaleKey: java.import("com.machinezoo.sourceafis.transparency.keys.ProbeGrayscaleKey"),
      ProbeImageKey: java.import("com.machinezoo.sourceafis.transparency.keys.ProbeImageKey"),
      ProbeTemplateKey: java.import("com.machinezoo.sourceafis.transparency.keys.ProbeTemplateKey"),
      RelativeContrastMaskKey: java.import("com.machinezoo.sourceafis.transparency.keys.RelativeContrastMaskKey"),
      RemovedDotsKey: java.import("com.machinezoo.sourceafis.transparency.keys.RemovedDotsKey"),
      RemovedFragmentsKey: java.import("com.machinezoo.sourceafis.transparency.keys.RemovedFragmentsKey"),
      RemovedGapsKey: java.import("com.machinezoo.sourceafis.transparency.keys.RemovedGapsKey"),
      RemovedMinutiaCloudsKey: java.import("com.machinezoo.sourceafis.transparency.keys.RemovedMinutiaCloudsKey"),
      RemovedPoresKey: java.import("com.machinezoo.sourceafis.transparency.keys.RemovedPoresKey"),
      RemovedTailsKey: java.import("com.machinezoo.sourceafis.transparency.keys.RemovedTailsKey"),
      RootsKey: java.import("com.machinezoo.sourceafis.transparency.keys.RootsKey"),
      ScaledImageKey: java.import("com.machinezoo.sourceafis.transparency.keys.ScaledImageKey"),
      ScoreKey: java.import("com.machinezoo.sourceafis.transparency.keys.ScoreKey"),
      SerializedObjectKey: java.import("com.machinezoo.sourceafis.transparency.keys.SerializedObjectKey"),
      ShuffledMinutiaeKey: java.import("com.machinezoo.sourceafis.transparency.keys.ShuffledMinutiaeKey"),
      SideGrayscaleKey: java.import("com.machinezoo.sourceafis.transparency.keys.SideGrayscaleKey"),
      SideImageKey: java.import("com.machinezoo.sourceafis.transparency.keys.SideImageKey"),
      SideKey: java.import("com.machinezoo.sourceafis.transparency.keys.SideKey"),
      SideTemplateKey: java.import("com.machinezoo.sourceafis.transparency.keys.SideTemplateKey"),
      SkeletonKey: java.import("com.machinezoo.sourceafis.transparency.keys.SkeletonKey"),
      SkeletonMinutiaeKey: java.import("com.machinezoo.sourceafis.transparency.keys.SkeletonMinutiaeKey"),
      SmoothedHistogramKey: java.import("com.machinezoo.sourceafis.transparency.keys.SmoothedHistogramKey"),
      SmoothedOrientationKey: java.import("com.machinezoo.sourceafis.transparency.keys.SmoothedOrientationKey"),
      ThinnedSkeletonKey: java.import("com.machinezoo.sourceafis.transparency.keys.ThinnedSkeletonKey"),
      TopMinutiaeKey: java.import("com.machinezoo.sourceafis.transparency.keys.TopMinutiaeKey"),
      TracedSkeletonKey: java.import("com.machinezoo.sourceafis.transparency.keys.TracedSkeletonKey"),
      UnknownTransparencyKey: java.import("com.machinezoo.sourceafis.transparency.keys.UnknownTransparencyKey"),
      VersionKey: java.import("com.machinezoo.sourceafis.transparency.keys.VersionKey"),
    },
    types: {
      Angle: java.import("com.machinezoo.sourceafis.transparency.types.Angle"),
      BlockGrid: java.import("com.machinezoo.sourceafis.transparency.types.BlockGrid"),
      BlockMap: java.import("com.machinezoo.sourceafis.transparency.types.BlockMap"),
      BooleanMatrix: java.import("com.machinezoo.sourceafis.transparency.types.BooleanMatrix"),
      ByteMatrix: java.import("com.machinezoo.sourceafis.transparency.types.ByteMatrix"),
      DoubleAngles: java.import("com.machinezoo.sourceafis.transparency.types.DoubleAngles"),
      DoubleMatrix: java.import("com.machinezoo.sourceafis.transparency.types.DoubleMatrix"),
      DoublePoint: java.import("com.machinezoo.sourceafis.transparency.types.DoublePoint"),
      DoublePointMatrix: java.import("com.machinezoo.sourceafis.transparency.types.DoublePointMatrix"),
      EdgeHashEntry: java.import("com.machinezoo.sourceafis.transparency.types.EdgeHashEntry"),
      EdgePair: java.import("com.machinezoo.sourceafis.transparency.types.EdgePair"),
      EdgeShape: java.import("com.machinezoo.sourceafis.transparency.types.EdgeShape"),
      FloatAngles: java.import("com.machinezoo.sourceafis.transparency.types.FloatAngles"),
      HistogramCube: java.import("com.machinezoo.sourceafis.transparency.types.HistogramCube"),
      IndexedEdge: java.import("com.machinezoo.sourceafis.transparency.types.IndexedEdge"),
      IntPoint: java.import("com.machinezoo.sourceafis.transparency.types.IntPoint"),
      IntRect: java.import("com.machinezoo.sourceafis.transparency.types.IntRect"),
      MatchSide: java.import("com.machinezoo.sourceafis.transparency.types.MatchSide"),
      MinutiaPair: java.import("com.machinezoo.sourceafis.transparency.types.MinutiaPair"),
      MinutiaPoint: java.import("com.machinezoo.sourceafis.transparency.types.MinutiaPoint"),
      MinutiaType: java.import("com.machinezoo.sourceafis.transparency.types.MinutiaType"),
      NeighborEdge: java.import("com.machinezoo.sourceafis.transparency.types.NeighborEdge"),
      OrientationAngle: java.import("com.machinezoo.sourceafis.transparency.types.OrientationAngle"),
      PairingGraph: java.import("com.machinezoo.sourceafis.transparency.types.PairingGraph"),
      PersistentTemplate: java.import("com.machinezoo.sourceafis.transparency.types.PersistentTemplate"),
      ScoreBreakdown: java.import("com.machinezoo.sourceafis.transparency.types.ScoreBreakdown"),
      SkeletonGraph: java.import("com.machinezoo.sourceafis.transparency.types.SkeletonGraph"),
      SkeletonRidge: java.import("com.machinezoo.sourceafis.transparency.types.SkeletonRidge"),
      SkeletonType: java.import("com.machinezoo.sourceafis.transparency.types.SkeletonType"),
      Template: java.import("com.machinezoo.sourceafis.transparency.types.Template"),
    },
    utils: {
      CborUtils: java.import("com.machinezoo.sourceafis.transparency.utils.CborUtils"),
    },
    };
  }
  return transparencyClasses;
}


export function withTransparencyZip(zipPath: string, fn: () => void): void {
  const loaded = _getClasses();
  const stream = new loaded.FileOutputStream(zipPath);
  const transparency = loaded.FingerprintTransparency.zipSync(stream);
  try {
    fn();
  } finally {
    transparency.closeSync();
    stream.closeSync();
  }
}
