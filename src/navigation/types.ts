import {
  BodyMeasurements,
  FitCalculationResult,
  GarmentMeasurements,
} from '../utils/estimator';

export type AuthStackParamList = {
  Login: undefined;
};

export type TryOnStackParamList = {
  PhotoUpload: undefined;
  SizeInput: {
    personPhotoUri: string;
    garmentPhotoUri: string;
  };
  Result: {
    personPhotoUri: string;
    garmentPhotoUri: string;
    body: BodyMeasurements;
    garment: GarmentMeasurements;
    fitResult: FitCalculationResult;
    jobId?: string;
  };
};

export type ProfileStackParamList = {
  Account: undefined;
};

export type MainTabParamList = {
  TryOnTab: undefined;
  ProfileTab: undefined;
};
