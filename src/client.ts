import { env, ExtensionContext, Uri, window, workspace } from 'vscode';
import {
  Executable,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from 'vscode-languageclient';
import { Config } from './configuration';
import { UriMessageItem } from './models/UriMessageItem';

const config = new Config();
let client: LanguageClient;

export async function activate(context: ExtensionContext): Promise<void> {
  if (config.serverPath === undefined || config.serverPath === '') {
    const selection = await window.showErrorMessage<UriMessageItem>(
      'Unable to find Nix language server',
      {
        title: 'Install language server',
        uri: Uri.parse('https://github.com/nix-community/rnix-lsp'),
      }
    );
    if (selection?.uri !== undefined) {
      await env.openExternal(selection?.uri);
      return;
    }
  }
  const serverExecutable: Executable = {
    command: config.serverPath,
  };
  const serverOptions: ServerOptions = serverExecutable;

  const nixDocumentSelector: { scheme: string; language: string }[] = [
    { scheme: 'file', language: 'nix' },
    { scheme: 'untitled', language: 'nix' },
  ];

  const clientOptions: LanguageClientOptions = {
    documentSelector: nixDocumentSelector,
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher('**/*.nix'),
    },
    outputChannel: window.createOutputChannel('Nix'),
  };

  client = new LanguageClient('nix', 'Nix', serverOptions, clientOptions);
  client.registerProposedFeatures();
  context.subscriptions.push(client.start());
}

export function deactivate(): Thenable<void> | undefined {
  return client ? client.stop() : undefined;
}