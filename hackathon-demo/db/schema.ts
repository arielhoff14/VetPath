import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const demoStatus=sqliteTable('demo_status',{id:integer('id').primaryKey(),status:text('status').notNull(),updatedAt:integer('updated_at').notNull()});
export const demoCases=sqliteTable('demo_cases',{id:text('id').primaryKey(),pet:text('pet').notNull(),reason:text('reason').notNull(),stage:text('stage').notNull(),createdAt:integer('created_at').notNull(),updatedAt:integer('updated_at').notNull(),lastAction:text('last_action')});
export const demoEvents=sqliteTable('demo_events',{id:text('id').primaryKey(),event:text('event').notNull(),createdAt:integer('created_at').notNull()});
