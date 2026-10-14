export type Row = Record<string, any>;
export type Statement = {
    sql: string;
    args?: any[];
};
export type Database = {
    first<T = Row>(sql: string, args?: any[]): Promise<T | null>;
    all<T = Row>(sql: string, args?: any[]): Promise<T[]>;
    batch(items: Statement[]): Promise<Array<{
        changes: number;
    }>>;
};
export type Context = {
    db: Database;
    actor: {
        userId: string;
    };
    now: () => Date;
};
export type WorkspaceInput = {
    name: string;
    slug: string;
    brandColor: string;
    timezone: string;
};
export type Workspace = WorkspaceInput & {
    id: string;
    ownerId: string;
    version: number;
    isDemo: number;
    createdAt: string;
};
export type Membership = {
    id: string;
    workspaceId: string;
    userId: string;
    role: 'owner' | 'editor';
    status: 'active' | 'revoked';
};
export type ChallengeInput = {
    title: string;
    game: string;
    description: string;
    rules: string;
    criteria: string;
    deadline: string;
};
export type EntryInput = {
    displayName: string;
    description: string;
    clipUrl: string;
    consent: boolean;
};
