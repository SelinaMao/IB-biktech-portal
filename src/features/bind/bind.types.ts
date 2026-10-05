export type DeviceBindingStatus =
  | "PENDING"
  | "SCANNED"
  | "CONSUMED"
  | "EXPIRED"
  | "CANCELLED";

export type DeviceBindingSession = {
  bindingSessionId: string;
  qrPayload: string;
  expiresIn: number;
  expiresAt: string;
};

export type DeviceBindingSessionStatus = {
  bindingSessionId: string;
  status: DeviceBindingStatus;
  qrExpiresAt: string;
  scannedAt?: string | null;
  pinSetupExpiresAt?: string | null;
  consumedAt?: string | null;
};

export type DeviceUnlinkResult = {
  devicesRevoked: number;
  unlinkedAt: string;
};

export type DeviceUnlinkRequest = {
  password: string;
};

export type DeviceBindingState = {
  linked: boolean;
  deviceName?: string | null;
  deviceModel?: string | null;
  platform?: "ANDROID" | "IOS" | null;
  boundAt?: string | null;
  lastSeenAt?: string | null;
};
