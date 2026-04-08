export interface FaceRow {
  id: string;
  name: string;
  type: "blacklist" | "whitelist";
}

export interface HistoryRow {
  id: string;
  message: string;
  timestamp: string;
  image_path: string;
}

export interface AlertPayload {
  id: string;
  message: string;
  timestamp: string;
}

export interface WsCameraFrame {
  camera_id: string;
  name: string;
  data: string;
}

export interface WsMultiFrame {
  type: "multi_frame";
  cameras: WsCameraFrame[];
  alert?: AlertPayload;
}

export interface Settings {
  emailEnabled: boolean;
  smtpServer: string;
  smtpPort: string;
  senderEmail: string;
  senderPassword: string;
  receiverEmail: string;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  roiPoints: [number, number][];
  showHeatmap: boolean;
  cameraSources: { name: string; source: string }[];
}
