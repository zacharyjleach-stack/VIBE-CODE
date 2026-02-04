/**
 * FileSystemManager - Workspace Management Service
 *
 * Manages isolated workspaces for mission execution, handling file operations,
 * workspace creation/cleanup, and providing a secure file system abstraction
 * for the agent swarm.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import type { Logger } from 'pino';

// =============================================================================
// Types
// =============================================================================

/**
 * Workspace configuration
 */
export interface WorkspaceConfig {
  rootPath: string;
  tempPath: string;
}

/**
 * Workspace metadata
 */
export interface WorkspaceInfo {
  missionId: string;
  path: string;
  createdAt: Date;
  lastAccessedAt: Date;
  fileCount: number;
  totalSizeBytes: number;
}

/**
 * File operation result
 */
export interface FileOperationResult {
  success: boolean;
  path: string;
  error?: string;
  bytesWritten?: number;
  bytesRead?: number;
}

/**
 * File metadata
 */
export interface FileInfo {
  path: string;
  relativePath: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  isDirectory: boolean;
}

/**
 * Read file options
 */
export interface ReadFileOptions {
  encoding?: BufferEncoding;
  maxSize?: number;
}

/**
 * Write file options
 */
export interface WriteFileOptions {
  encoding?: BufferEncoding;
  createDirectories?: boolean;
  overwrite?: boolean;
}

/**
 * FileSystemManager events
 */
interface FileSystemManagerEvents {
  'workspace:created': (data: { missionId: string; path: string }) => void;
  'workspace:deleted': (data: { missionId: string; path: string }) => void;
  'file:created': (data: { missionId: string; filePath: string }) => void;
  'file:modified': (data: { missionId: string; filePath: string }) => void;
  'file:deleted': (data: { missionId: string; filePath: string }) => void;
  'error': (data: { operation: string; error: Error }) => void;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_ENCODING: BufferEncoding = 'utf-8';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const WORKSPACE_CLEANUP_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// =============================================================================
// FileSystemManager Class
// =============================================================================

export class FileSystemManager extends EventEmitter {
  private readonly config: WorkspaceConfig;
  private readonly logger: Logger;
  private readonly workspaces: Map<string, WorkspaceInfo>;
  private initialized: boolean = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: WorkspaceConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger.child({ component: 'FileSystemManager' });
    this.workspaces = new Map();
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  /**
   * Initializes the file system manager
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('FileSystemManager already initialized');
      return;
    }

    this.logger.info(
      { rootPath: this.config.rootPath, tempPath: this.config.tempPath },
      'Initializing FileSystemManager'
    );

    try {
      // Create root directories
      await this.ensureDirectoryExists(this.config.rootPath);
      await this.ensureDirectoryExists(this.config.tempPath);

      // Scan for existing workspaces
      await this.scanExistingWorkspaces();

      // Start cleanup interval
      this.cleanupInterval = setInterval(
        () => this.performCleanup(),
        60 * 60 * 1000 // Run every hour
      );

      this.initialized = true;
      this.logger.info('FileSystemManager initialization complete');
    } catch (error) {
      this.logger.error({ error }, 'Failed to initialize FileSystemManager');
      throw error;
    }
  }

  /**
   * Scans for existing workspaces on startup
   */
  private async scanExistingWorkspaces(): Promise<void> {
    try {
      const entries = await fs.readdir(this.config.rootPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const missionId = entry.name;
          const workspacePath = path.join(this.config.rootPath, missionId);

          try {
            const stats = await fs.stat(workspacePath);
            const fileCount = await this.countFiles(workspacePath);

            this.workspaces.set(missionId, {
              missionId,
              path: workspacePath,
              createdAt: stats.birthtime,
              lastAccessedAt: stats.mtime,
              fileCount,
              totalSizeBytes: await this.calculateDirectorySize(workspacePath),
            });

            this.logger.debug({ missionId, path: workspacePath }, 'Found existing workspace');
          } catch (error) {
            this.logger.warn({ error, missionId }, 'Failed to scan workspace');
          }
        }
      }

      this.logger.info({ workspaceCount: this.workspaces.size }, 'Existing workspaces scanned');
    } catch (error) {
      // Directory might not exist yet, which is fine
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn({ error }, 'Error scanning existing workspaces');
      }
    }
  }

  // ===========================================================================
  // Workspace Management
  // ===========================================================================

  /**
   * Creates an isolated workspace for a mission
   */
  public async createWorkspace(missionId: string): Promise<string> {
    this.ensureInitialized();

    const workspacePath = path.join(this.config.rootPath, missionId);

    this.logger.info({ missionId, path: workspacePath }, 'Creating workspace');

    try {
      // Check if workspace already exists
      if (this.workspaces.has(missionId)) {
        this.logger.warn({ missionId }, 'Workspace already exists');
        return this.workspaces.get(missionId)!.path;
      }

      // Create workspace directory
      await this.ensureDirectoryExists(workspacePath);

      // Create standard subdirectories
      const subdirs = ['src', 'tests', 'docs', '.aegis'];
      for (const subdir of subdirs) {
        await this.ensureDirectoryExists(path.join(workspacePath, subdir));
      }

      // Create workspace metadata file
      const metadata = {
        missionId,
        createdAt: new Date().toISOString(),
        version: '1.0.0',
      };

      await this.writeFile(
        missionId,
        '.aegis/metadata.json',
        JSON.stringify(metadata, null, 2)
      );

      // Register workspace
      const workspaceInfo: WorkspaceInfo = {
        missionId,
        path: workspacePath,
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        fileCount: 1, // metadata.json
        totalSizeBytes: 0,
      };

      this.workspaces.set(missionId, workspaceInfo);

      // Emit event
      this.emit('workspace:created', { missionId, path: workspacePath });

      this.logger.info({ missionId, path: workspacePath }, 'Workspace created successfully');

      return workspacePath;
    } catch (error) {
      this.logger.error({ error, missionId }, 'Failed to create workspace');
      throw new Error(`Failed to create workspace: ${(error as Error).message}`);
    }
  }

  /**
   * Gets workspace information
   */
  public getWorkspace(missionId: string): WorkspaceInfo | null {
    return this.workspaces.get(missionId) || null;
  }

  /**
   * Gets all workspace information
   */
  public getAllWorkspaces(): WorkspaceInfo[] {
    return Array.from(this.workspaces.values());
  }

  /**
   * Checks if a workspace exists
   */
  public hasWorkspace(missionId: string): boolean {
    return this.workspaces.has(missionId);
  }

  /**
   * Deletes a workspace and all its contents
   */
  public async deleteWorkspace(missionId: string): Promise<boolean> {
    this.ensureInitialized();

    const workspace = this.workspaces.get(missionId);

    if (!workspace) {
      this.logger.warn({ missionId }, 'Workspace not found for deletion');
      return false;
    }

    this.logger.info({ missionId, path: workspace.path }, 'Deleting workspace');

    try {
      // Remove directory recursively
      await fs.rm(workspace.path, { recursive: true, force: true });

      // Remove from registry
      this.workspaces.delete(missionId);

      // Emit event
      this.emit('workspace:deleted', { missionId, path: workspace.path });

      this.logger.info({ missionId }, 'Workspace deleted successfully');

      return true;
    } catch (error) {
      this.logger.error({ error, missionId }, 'Failed to delete workspace');
      this.emit('error', { operation: 'deleteWorkspace', error: error as Error });
      return false;
    }
  }

  // ===========================================================================
  // File Operations
  // ===========================================================================

  /**
   * Writes a file to a workspace
   */
  public async writeFile(
    missionId: string,
    relativePath: string,
    content: string | Buffer,
    options: WriteFileOptions = {}
  ): Promise<FileOperationResult> {
    this.ensureInitialized();

    const workspace = this.workspaces.get(missionId);

    if (!workspace) {
      return {
        success: false,
        path: relativePath,
        error: 'Workspace not found',
      };
    }

    const fullPath = this.resolvePath(workspace.path, relativePath);

    // Security check: ensure path is within workspace
    if (!this.isPathWithinWorkspace(fullPath, workspace.path)) {
      this.logger.warn({ missionId, relativePath, fullPath }, 'Path traversal attempt detected');
      return {
        success: false,
        path: relativePath,
        error: 'Invalid path: path traversal not allowed',
      };
    }

    this.logger.debug({ missionId, relativePath }, 'Writing file');

    try {
      const encoding = options.encoding || DEFAULT_ENCODING;
      const createDirectories = options.createDirectories !== false;
      const overwrite = options.overwrite !== false;

      // Check if file exists and overwrite is disabled
      if (!overwrite) {
        try {
          await fs.access(fullPath);
          return {
            success: false,
            path: relativePath,
            error: 'File already exists and overwrite is disabled',
          };
        } catch {
          // File doesn't exist, continue
        }
      }

      // Create parent directories if needed
      if (createDirectories) {
        const dir = path.dirname(fullPath);
        await this.ensureDirectoryExists(dir);
      }

      // Write file
      const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, encoding);

      // Check file size
      if (buffer.length > MAX_FILE_SIZE) {
        return {
          success: false,
          path: relativePath,
          error: `File too large: ${buffer.length} bytes exceeds limit of ${MAX_FILE_SIZE} bytes`,
        };
      }

      const isNewFile = !(await this.fileExists(fullPath));
      await fs.writeFile(fullPath, buffer, { encoding });

      // Update workspace metadata
      workspace.lastAccessedAt = new Date();
      if (isNewFile) {
        workspace.fileCount++;
        this.emit('file:created', { missionId, filePath: relativePath });
      } else {
        this.emit('file:modified', { missionId, filePath: relativePath });
      }

      this.logger.debug({ missionId, relativePath, bytes: buffer.length }, 'File written successfully');

      return {
        success: true,
        path: relativePath,
        bytesWritten: buffer.length,
      };
    } catch (error) {
      this.logger.error({ error, missionId, relativePath }, 'Failed to write file');
      this.emit('error', { operation: 'writeFile', error: error as Error });

      return {
        success: false,
        path: relativePath,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Reads a file from a workspace
   */
  public async readFile(
    missionId: string,
    relativePath: string,
    options: ReadFileOptions = {}
  ): Promise<{ success: boolean; content?: string | Buffer; error?: string }> {
    this.ensureInitialized();

    const workspace = this.workspaces.get(missionId);

    if (!workspace) {
      return {
        success: false,
        error: 'Workspace not found',
      };
    }

    const fullPath = this.resolvePath(workspace.path, relativePath);

    // Security check
    if (!this.isPathWithinWorkspace(fullPath, workspace.path)) {
      return {
        success: false,
        error: 'Invalid path: path traversal not allowed',
      };
    }

    this.logger.debug({ missionId, relativePath }, 'Reading file');

    try {
      const encoding = options.encoding || DEFAULT_ENCODING;
      const maxSize = options.maxSize || MAX_FILE_SIZE;

      // Check file size
      const stats = await fs.stat(fullPath);
      if (stats.size > maxSize) {
        return {
          success: false,
          error: `File too large: ${stats.size} bytes exceeds limit of ${maxSize} bytes`,
        };
      }

      // Read file
      const content = await fs.readFile(fullPath, { encoding });

      // Update workspace metadata
      workspace.lastAccessedAt = new Date();

      return {
        success: true,
        content,
      };
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;

      if (nodeError.code === 'ENOENT') {
        return {
          success: false,
          error: 'File not found',
        };
      }

      this.logger.error({ error, missionId, relativePath }, 'Failed to read file');

      return {
        success: false,
        error: nodeError.message,
      };
    }
  }

  /**
   * Deletes a file from a workspace
   */
  public async deleteFile(missionId: string, relativePath: string): Promise<FileOperationResult> {
    this.ensureInitialized();

    const workspace = this.workspaces.get(missionId);

    if (!workspace) {
      return {
        success: false,
        path: relativePath,
        error: 'Workspace not found',
      };
    }

    const fullPath = this.resolvePath(workspace.path, relativePath);

    // Security check
    if (!this.isPathWithinWorkspace(fullPath, workspace.path)) {
      return {
        success: false,
        path: relativePath,
        error: 'Invalid path: path traversal not allowed',
      };
    }

    this.logger.debug({ missionId, relativePath }, 'Deleting file');

    try {
      await fs.unlink(fullPath);

      // Update workspace metadata
      workspace.lastAccessedAt = new Date();
      workspace.fileCount = Math.max(0, workspace.fileCount - 1);

      // Emit event
      this.emit('file:deleted', { missionId, filePath: relativePath });

      return {
        success: true,
        path: relativePath,
      };
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;

      if (nodeError.code === 'ENOENT') {
        return {
          success: false,
          path: relativePath,
          error: 'File not found',
        };
      }

      this.logger.error({ error, missionId, relativePath }, 'Failed to delete file');

      return {
        success: false,
        path: relativePath,
        error: nodeError.message,
      };
    }
  }

  /**
   * Lists files in a workspace directory
   */
  public async listFiles(
    missionId: string,
    relativePath: string = ''
  ): Promise<{ success: boolean; files?: FileInfo[]; error?: string }> {
    this.ensureInitialized();

    const workspace = this.workspaces.get(missionId);

    if (!workspace) {
      return {
        success: false,
        error: 'Workspace not found',
      };
    }

    const fullPath = this.resolvePath(workspace.path, relativePath);

    // Security check
    if (!this.isPathWithinWorkspace(fullPath, workspace.path)) {
      return {
        success: false,
        error: 'Invalid path: path traversal not allowed',
      };
    }

    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const files: FileInfo[] = [];

      for (const entry of entries) {
        const entryPath = path.join(fullPath, entry.name);
        const entryRelativePath = path.join(relativePath, entry.name);

        try {
          const stats = await fs.stat(entryPath);

          files.push({
            path: entryPath,
            relativePath: entryRelativePath,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            isDirectory: entry.isDirectory(),
          });
        } catch {
          // Skip files we can't stat
        }
      }

      return {
        success: true,
        files,
      };
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;

      if (nodeError.code === 'ENOENT') {
        return {
          success: false,
          error: 'Directory not found',
        };
      }

      this.logger.error({ error, missionId, relativePath }, 'Failed to list files');

      return {
        success: false,
        error: nodeError.message,
      };
    }
  }

  /**
   * Checks if a file exists in a workspace
   */
  public async exists(missionId: string, relativePath: string): Promise<boolean> {
    const workspace = this.workspaces.get(missionId);

    if (!workspace) {
      return false;
    }

    const fullPath = this.resolvePath(workspace.path, relativePath);

    if (!this.isPathWithinWorkspace(fullPath, workspace.path)) {
      return false;
    }

    return this.fileExists(fullPath);
  }

  /**
   * Copies a file within a workspace
   */
  public async copyFile(
    missionId: string,
    sourcePath: string,
    destPath: string
  ): Promise<FileOperationResult> {
    this.ensureInitialized();

    const workspace = this.workspaces.get(missionId);

    if (!workspace) {
      return {
        success: false,
        path: destPath,
        error: 'Workspace not found',
      };
    }

    const fullSourcePath = this.resolvePath(workspace.path, sourcePath);
    const fullDestPath = this.resolvePath(workspace.path, destPath);

    // Security checks
    if (
      !this.isPathWithinWorkspace(fullSourcePath, workspace.path) ||
      !this.isPathWithinWorkspace(fullDestPath, workspace.path)
    ) {
      return {
        success: false,
        path: destPath,
        error: 'Invalid path: path traversal not allowed',
      };
    }

    try {
      // Ensure destination directory exists
      await this.ensureDirectoryExists(path.dirname(fullDestPath));

      // Copy file
      await fs.copyFile(fullSourcePath, fullDestPath);

      // Update workspace metadata
      workspace.lastAccessedAt = new Date();
      workspace.fileCount++;

      // Emit event
      this.emit('file:created', { missionId, filePath: destPath });

      return {
        success: true,
        path: destPath,
      };
    } catch (error) {
      this.logger.error({ error, missionId, sourcePath, destPath }, 'Failed to copy file');

      return {
        success: false,
        path: destPath,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Creates a directory in a workspace
   */
  public async createDirectory(
    missionId: string,
    relativePath: string
  ): Promise<FileOperationResult> {
    this.ensureInitialized();

    const workspace = this.workspaces.get(missionId);

    if (!workspace) {
      return {
        success: false,
        path: relativePath,
        error: 'Workspace not found',
      };
    }

    const fullPath = this.resolvePath(workspace.path, relativePath);

    if (!this.isPathWithinWorkspace(fullPath, workspace.path)) {
      return {
        success: false,
        path: relativePath,
        error: 'Invalid path: path traversal not allowed',
      };
    }

    try {
      await this.ensureDirectoryExists(fullPath);

      workspace.lastAccessedAt = new Date();

      return {
        success: true,
        path: relativePath,
      };
    } catch (error) {
      this.logger.error({ error, missionId, relativePath }, 'Failed to create directory');

      return {
        success: false,
        path: relativePath,
        error: (error as Error).message,
      };
    }
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  /**
   * Gets the absolute path for a workspace file
   */
  public getAbsolutePath(missionId: string, relativePath: string): string | null {
    const workspace = this.workspaces.get(missionId);

    if (!workspace) {
      return null;
    }

    const fullPath = this.resolvePath(workspace.path, relativePath);

    if (!this.isPathWithinWorkspace(fullPath, workspace.path)) {
      return null;
    }

    return fullPath;
  }

  /**
   * Creates a temporary file and returns its path
   */
  public async createTempFile(
    content: string | Buffer,
    extension: string = '.tmp'
  ): Promise<string> {
    this.ensureInitialized();

    const tempFileName = `${uuidv4()}${extension}`;
    const tempFilePath = path.join(this.config.tempPath, tempFileName);

    await fs.writeFile(tempFilePath, content);

    return tempFilePath;
  }

  /**
   * Deletes a temporary file
   */
  public async deleteTempFile(tempFilePath: string): Promise<boolean> {
    // Security check: ensure path is within temp directory
    const normalizedPath = path.normalize(tempFilePath);
    if (!normalizedPath.startsWith(this.config.tempPath)) {
      this.logger.warn({ tempFilePath }, 'Attempted to delete file outside temp directory');
      return false;
    }

    try {
      await fs.unlink(tempFilePath);
      return true;
    } catch (error) {
      this.logger.warn({ error, tempFilePath }, 'Failed to delete temp file');
      return false;
    }
  }

  // ===========================================================================
  // Internal Helpers
  // ===========================================================================

  /**
   * Ensures the manager is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('FileSystemManager not initialized. Call initialize() first.');
    }
  }

  /**
   * Ensures a directory exists, creating it if necessary
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Checks if a file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Resolves a relative path within a workspace
   */
  private resolvePath(workspacePath: string, relativePath: string): string {
    // Normalize and join paths
    const normalized = path.normalize(relativePath);
    return path.join(workspacePath, normalized);
  }

  /**
   * Checks if a path is within a workspace (prevents path traversal)
   */
  private isPathWithinWorkspace(fullPath: string, workspacePath: string): boolean {
    const normalizedFullPath = path.normalize(fullPath);
    const normalizedWorkspacePath = path.normalize(workspacePath);
    return normalizedFullPath.startsWith(normalizedWorkspacePath);
  }

  /**
   * Counts files in a directory recursively
   */
  private async countFiles(dirPath: string): Promise<number> {
    let count = 0;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          count += await this.countFiles(path.join(dirPath, entry.name));
        } else {
          count++;
        }
      }
    } catch {
      // Directory might not exist or be inaccessible
    }

    return count;
  }

  /**
   * Calculates total size of a directory
   */
  private async calculateDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          totalSize += await this.calculateDirectorySize(entryPath);
        } else {
          const stats = await fs.stat(entryPath);
          totalSize += stats.size;
        }
      }
    } catch {
      // Directory might not exist or be inaccessible
    }

    return totalSize;
  }

  /**
   * Performs periodic cleanup of stale workspaces
   */
  private async performCleanup(): Promise<void> {
    this.logger.debug('Performing workspace cleanup');

    const now = Date.now();
    const staleWorkspaces: string[] = [];

    for (const [missionId, workspace] of this.workspaces) {
      const age = now - workspace.lastAccessedAt.getTime();

      if (age > WORKSPACE_CLEANUP_AGE_MS) {
        staleWorkspaces.push(missionId);
      }
    }

    if (staleWorkspaces.length > 0) {
      this.logger.info({ count: staleWorkspaces.length }, 'Cleaning up stale workspaces');

      for (const missionId of staleWorkspaces) {
        await this.deleteWorkspace(missionId);
      }
    }

    // Clean up temp files
    await this.cleanupTempFiles();
  }

  /**
   * Cleans up old temporary files
   */
  private async cleanupTempFiles(): Promise<void> {
    try {
      const entries = await fs.readdir(this.config.tempPath, { withFileTypes: true });
      const now = Date.now();

      for (const entry of entries) {
        if (entry.isFile()) {
          const filePath = path.join(this.config.tempPath, entry.name);

          try {
            const stats = await fs.stat(filePath);
            const age = now - stats.mtime.getTime();

            // Delete temp files older than 1 hour
            if (age > 60 * 60 * 1000) {
              await fs.unlink(filePath);
              this.logger.debug({ filePath }, 'Deleted stale temp file');
            }
          } catch {
            // Skip files we can't stat or delete
          }
        }
      }
    } catch (error) {
      this.logger.warn({ error }, 'Error cleaning up temp files');
    }
  }

  // ===========================================================================
  // Cleanup
  // ===========================================================================

  /**
   * Shuts down the file system manager
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down FileSystemManager');

    // Stop cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.workspaces.clear();
    this.initialized = false;

    this.logger.info('FileSystemManager shutdown complete');
  }

  // ===========================================================================
  // Typed Event Emitter Methods
  // ===========================================================================

  public override on<K extends keyof FileSystemManagerEvents>(
    event: K,
    listener: FileSystemManagerEvents[K]
  ): this {
    return super.on(event, listener);
  }

  public override emit<K extends keyof FileSystemManagerEvents>(
    event: K,
    ...args: Parameters<FileSystemManagerEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }
}
