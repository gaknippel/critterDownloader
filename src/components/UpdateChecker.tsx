import { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { Button } from '@/components/ui/button';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const update = await check();
      if (update?.available) {
        setUpdateAvailable(true);
        setUpdateVersion(update.version);
      }
    } catch (error) {
      console.error('failed to check for updates:', error);
    }
  };

  const installUpdate = async () => {
    try {
      setDownloading(true);
      const update = await check();
      
      if (update?.available) {
        await update.downloadAndInstall();
        await relaunch();
      }
    } catch (error) {
      console.error('failed to install update:', error);
      setDownloading(false);
    }
  };

  if (!updateAvailable) return null;

  return (
    <Alert className="fixed top-4 right-4 w-96 z-50">
      <AlertTitle>update available!</AlertTitle>
      <AlertDescription>
        <p className="mb-2">version {updateVersion} is available.</p>
        <Button 
          onClick={installUpdate} 
          disabled={downloading}
          size="sm"
        >
          {downloading ? 'Downloading...' : 'Update Now'}
        </Button>
      </AlertDescription>
    </Alert>
  );
}