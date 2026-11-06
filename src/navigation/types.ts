import { NavigatorScreenParams } from '@react-navigation/native';
import {
  BodyMeasurements,
  FitCalculationResult,
  GarmentMeasurements,
} from '../utils/estimator';
import { ClosetGarment } from '../hooks/useCloset';

export type AuthStackParamList = {
  Login: undefined;
};

export type TryOnStackParamList = {
  PhotoUpload: { garment?: ClosetGarment } | undefined;
  SizeInput: {
    personPhotoUri: string;
    garmentPhotoUri: string;
    garmentPreset?: ClosetGarment;
  };
  Result: {
    personPhotoUri: string;
    garmentPhotoUri: string;
    body: BodyMeasurements;
    garment: GarmentMeasurements;
    fitResult: FitCalculationResult;
    resultImageUri?: string;
    jobId?: string;
  };
};

export type MainTabParamList = {
  ClosetTab: undefined;
  TryOnTab: NavigatorScreenParams<TryOnStackParamList> | undefined;
  ProfileTab: undefined;
};
