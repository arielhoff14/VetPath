import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',timeout:30000,use:{baseURL:'http://127.0.0.1:4317',browserName:'chromium'},webServer:{command:'node scripts/preview.mjs',cwd:process.cwd()+'/hackathon-demo',url:'http://127.0.0.1:4317',reuseExistingServer:!process.env.CI,timeout:30000},reporter:'list'});
