import { Plugin, PluginType } from '../../plugin';
import { existsAsync, isInstalled, readdirAsync } from '../../common';
import { join } from 'path';
import { IOS_PATH } from '../../config';
import { ls } from 'shelljs';

export function findXcodePath(): string | null {
  for (let file of ls(IOS_PATH)) {
    if (file.endsWith('.xcworkspace')) {
      return join(IOS_PATH, file);
    }
  }
  return null;
}

export async function checkCocoaPods(): Promise<string | null> {
  if (!isInstalled('pod')) {
    return 'cocoapods is not installed. For information: https://guides.cocoapods.org/using/getting-started.html#installation';
  }
  return null;
}

export async function checkIOSProject(): Promise <string | null> {
  const exists = await isIOSAvailable();
  if (!exists) {
    return 'iOS was not created yet. Run `avocado start ios`.';
  }
  return null;
}

export async function checkNoIOSProject(): Promise <string | null> {
  const exists = await isIOSAvailable();
  if (exists) {
    return 'An iOS project already exist';
  }
  return null;
}

export function isIOSAvailable(): Promise<boolean> {
  return existsAsync(IOS_PATH);
}

export async function getIOSPlugins(allPlugins: Plugin[]): Promise<Plugin[]> {
  const resolved = await Promise.all(allPlugins.map(resolvePlugin));
  return resolved.filter(plugin => !!plugin) as Plugin[];
}

export async function resolvePlugin(plugin: Plugin): Promise<Plugin|null> {
  const iosManifest = plugin.manifest.ios;
  if (!iosManifest) {
    return null;
  }
  try {
    if (!iosManifest.src) {
      throw 'avocado.ios.path is missing';
    }

    const iosPath = join(plugin.rootPath, iosManifest.src);
    plugin.ios = {
      name: plugin.name,
      type: PluginType.Code,
      path: iosPath
    };
    const files = await readdirAsync(iosPath);
    const podSpec = files.find(file => file.endsWith('.podspec'));
    if (podSpec) {
      plugin.ios.type = PluginType.Cocoapods;
      plugin.ios.name = podSpec.split('.')[0];
    }
  } catch (e) {
    return null;
  }
  return plugin;
}
