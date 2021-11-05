import { DatabasePageProperties } from './DatabasePageProperties';

export interface RenderDatabasePageTask {
    id: string;
    file: string;
    properties: DatabasePageProperties;
    render: () => Promise<any>;
}
