import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { RecoverySession } from '../types';

function sessionsToCsv(sessions: RecoverySession[]): string {
  const header = 'Date,Modality,Duration(min),Soreness,RecoveryDelta,DeviceConnected\n';
  const rows = sessions
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(
      (s) =>
        `${s.date},${s.modality},${s.durationMinutes},${s.sorenessScore},${s.recoveryDelta.toFixed(1)},${s.deviceConnected}`
    )
    .join('\n');
  return header + rows;
}

export async function csvExport(sessions: RecoverySession[]): Promise<void> {
  const csv = sessionsToCsv(sessions);
  const filename = `pulseflow-export-${new Date().toISOString().split('T')[0]}.csv`;
  const fileUri = FileSystem.cacheDirectory + filename;

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export PulseFlow Data',
    });
  }
}
