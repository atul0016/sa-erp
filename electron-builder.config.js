/**
 * Electron Builder Configuration
 * For packaging the SA ERP application
 */

const config = {
  appId: 'com.enterprise.sa-erp',
  productName: 'SA ERP',
  copyright: 'Copyright © 2024 Enterprise Solutions',
  
  directories: {
    output: 'release',
    buildResources: 'build',
  },
  
  files: [
    'dist/**/*',
    'package.json',
  ],
  
  extraFiles: [
    {
      from: 'data',
      to: 'data',
      filter: ['**/*'],
    },
  ],
  
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ],
    icon: 'build/icon.ico',
    artifactName: '${productName}-${version}-Setup.${ext}',
  },
  
  nsis: {
    oneClick: false,
    perMachine: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'build/icon.ico',
    uninstallerIcon: 'build/icon.ico',
    installerHeaderIcon: 'build/icon.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'SA ERP',
  },
  
  mac: {
    target: ['dmg', 'zip'],
    category: 'public.app-category.business',
    icon: 'build/icon.icns',
    artifactName: '${productName}-${version}.${ext}',
  },
  
  linux: {
    target: ['AppImage', 'deb'],
    category: 'Office',
    icon: 'build/icons',
    artifactName: '${productName}-${version}.${ext}',
  },
};

module.exports = config;

