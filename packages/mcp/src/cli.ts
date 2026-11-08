#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createFabricServer } from './server.js';

await createFabricServer().connect(new StdioServerTransport());
