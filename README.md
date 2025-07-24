# Bitcoin Ordinal Holder Indexer

A comprehensive TypeScript application for analyzing Bitcoin inscription holders across collections using the BestInSlot API. This tool fetches collection data, analyzes holder patterns, and generates filtered reports for investment and analysis purposes.

## 🚀 Features

- **Collection Data Fetching**: Automatically retrieves all inscription collections from BestInSlot API
- **Bitmap Holder Analysis**: Fetches comprehensive bitmap holder data
- **Cross-Collection Analysis**: Identifies wallets holding inscriptions across multiple collections
- **Smart Filtering**: Filters holders based on inscription count thresholds
- **Automated File Management**: Generates timestamped reports with automatic latest file detection
- **Large Data Handling**: Automatic chunking and merging for extremely large datasets
- **Rate Limiting**: Built-in delays to respect API rate limits
- **Comprehensive Logging**: Detailed logging with timestamps and context
- **Error Handling**: Robust error handling with graceful fallbacks
- **Modular Architecture**: Clean, maintainable, and testable codebase

## 📊 Data Pipeline

```
1. Collection Fetching → 2. Bitmap Fetching → 3. Holder Analysis → 4. Data Aggregation → 5. Filtering → 6. Report Generation
   
   ├── API: BestInSlot Collections
   ├── API: BestInSlot Bitmaps
   ├── API: Collection Holders  
   ├── Merge holder data
   ├── Filter by criteria
   └── Generate timestamped reports
```

## 🏗️ Project Structure

```
src/
├── index.ts                    # Main application entry point (65 lines)
├── services/                   # Business logic services
│   ├── index.ts               # Service exports
│   ├── api.ts                 # BestInSlot API interactions
│   ├── fileManager.ts         # File system operations
│   ├── dataProcessor.ts       # Data analysis and processing
│   └── orchestrator.ts        # Application workflow coordination
├── types/
│   └── index.ts               # TypeScript interfaces (ICollection, IHolder, IBitmap)
├── utils/
│   ├── logger.ts              # Advanced logging utility
│   └── delay.ts               # Rate limiting utility
└── __tests__/
    └── calculator.test.ts      # Unit tests

data/                           # Generated data files (gitignored)
├── collections-YYYY-MM-DDTHH-mm-ss-sssZ.json
├── bitmapList-YYYY-MM-DDTHH-mm-ss-sssZ.json
├── holderSummary-YYYY-MM-DDTHH-mm-ss-sssZ.json
├── holderSummary-YYYY-MM-DDTHH-mm-ss-sssZ-chunk1.json (for large datasets)
└── FinalResult-YYYY-MM-DDTHH-mm-ss-sssZ.json
```

## 🛠️ Installation & Setup

### Prerequisites

- **Node.js** (version 18 or higher)
- **npm** or **yarn**
- **BestInSlot API Key** ([Get one here](https://bestinslot.xyz))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/michalstefanow/bitcoin-ordinal-holder-indexer
   cd bitcoin-ordinal-holder-indexer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the project root:
   ```env
   BEST_IN_SLOT=your_api_key_here
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

## 🎯 Usage

### Full Analysis Pipeline

Run the complete analysis pipeline:

```bash
npm run dev
```

This executes:
1. **Collection Fetching**: Downloads all inscription collections
2. **Bitmap Fetching**: Downloads all bitmap holder data
3. **Holder Summarization**: Analyzes holders across collections and bitmaps
4. **Data Filtering**: Applies filtering criteria (holders with ≥10 inscriptions)

### Flexible Execution Modes

The new modular architecture provides multiple execution modes:

#### **Full Pipeline** (Default)
```typescript
import { runFullPipeline } from './services';

// Execute complete analysis pipeline
await runFullPipeline();
```

#### **Data Fetching Only**
```typescript
import { runDataFetchingOnly } from './services';

// Update source data without re-analyzing
await runDataFetchingOnly();
```

#### **Analysis Only**
```typescript
import { runAnalysisOnly } from './services';

// Re-analyze existing data
await runAnalysisOnly();
```

#### **Individual Operations**
```typescript
import { runHolderSummarizationOnly, runHolderFilteringOnly } from './services';

// Summarize holders only
await runHolderSummarizationOnly();

// Filter holders only
await runHolderFilteringOnly();
```

#### **Status Check**
```typescript
import { getAnalysisStatus } from './services';

// Get current analysis status
const status = await getAnalysisStatus();
console.log(`Qualified holders: ${status.qualifiedHolders}`);
```

### Individual Service Usage

You can also use individual services directly:

```typescript
import { 
  fetchCollectionList, 
  saveCollectionsToFile,
  getLatestCollectionsFile 
} from './services';

// Fetch and save collections
const collections = await fetchCollectionList();
await saveCollectionsToFile(collections);

// Get latest collections file
const latestFile = await getLatestCollectionsFile();
```

## 📁 Output Files

The application generates several types of timestamped files:

### **Collections Data** (`collections-*.json`)
- Raw collection data from BestInSlot API
- Contains collection metadata, statistics, and identifiers

### **Bitmap Data** (`bitmapList-*.json`)
- Bitmap holder data from BestInSlot API
- Contains wallet addresses and their bitmap inscriptions

### **Holder Summary** (`holderSummary-*.json`)
- Aggregated holder data across all collections and bitmaps
- Maps wallet addresses to all their inscription IDs
- May be split into chunks for large datasets (`holderSummary-*-chunk*.json`)

### **Final Results** (`FinalResult-*.json`)
- Filtered holder data meeting criteria (≥10 inscriptions)
- Primary output for investment analysis

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BEST_IN_SLOT` | BestInSlot API key | Yes |

### Filtering Criteria

The default filtering threshold is **10 inscriptions per wallet**. This can be modified in `src/services/dataProcessor.ts`:

```typescript
// In filterHolders() function
if (inscriptions && inscriptions.length >= 10) { // Change this number
  filteredHoldersSummary[wallet] = inscriptions;
}
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run dev` | Run the application in development mode |
| `npm run start` | Run the compiled application |
| `npm run test` | Run unit tests |
| `npm run lint` | Run ESLint for code quality |
| `npm run format` | Format code with Prettier |

## 🏗️ Architecture Overview

### **Service Modules**

#### **API Service** (`src/services/api.ts`)
- Handles all BestInSlot API interactions
- Implements rate limiting and error handling
- Supports pagination for large datasets

#### **File Manager Service** (`src/services/fileManager.ts`)
- Manages all file system operations
- Handles automatic chunking for large files
- Implements safe JSON serialization
- Merges chunked files automatically

#### **Data Processor Service** (`src/services/dataProcessor.ts`)
- Processes and analyzes holder data
- Implements cross-collection aggregation
- Handles data validation and cleaning
- Applies filtering criteria

#### **Orchestrator Service** (`src/services/orchestrator.ts`)
- Coordinates the complete application workflow
- Provides flexible execution modes
- Manages error handling and logging

### **Key Features**

- **Modular Design**: Each service has a single responsibility
- **Error Isolation**: Errors in one service don't affect others
- **Memory Efficiency**: Handles extremely large datasets through chunking
- **Type Safety**: Full TypeScript support with strict typing
- **Professional Logging**: Structured logging with context and timestamps

## 🧪 Testing

The modular architecture enables easy testing:

```typescript
// Test individual services
import { fetchCollectionList } from './services/api';
import { getLatestCollectionsFile } from './services/fileManager';
import { filterHolders } from './services/dataProcessor';

// Each service can be tested in isolation
```

## 📈 Performance & Scalability

### **Large Data Handling**
- **Automatic Chunking**: Files >50MB are automatically split
- **Memory Management**: Efficient handling of large datasets
- **Safe Serialization**: Robust JSON serialization with fallbacks

### **API Optimization**
- **Rate Limiting**: 1.5-second delays between requests
- **Pagination**: Efficient data fetching in batches
- **Error Recovery**: Graceful handling of API failures

## 🔮 Future Enhancements

The modular architecture enables easy future enhancements:

1. **Database Integration**: Add database service for persistent storage
2. **Web API**: Create REST API service for external access
3. **Real-time Processing**: Add streaming service for live data
4. **Advanced Analytics**: Add analytics service for deeper insights
5. **Configuration Management**: Add config service for dynamic settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

- **Email**: michalstefanow.marek@gmail.com
- **Telegram**: @mylord1_1
- **GitHub**: [@michalstefanow](https://github.com/michalstefanow)

## 🆘 Troubleshooting

### Common Issues

**API Key Error**
```
Error: BEST_IN_SLOT API key is required
```
**Solution**: Ensure your `.env` file contains the correct API key.

**Memory Issues**
```
Error: Invalid string length
```
**Solution**: The application automatically handles large datasets through chunking.

**File Not Found**
```
Error: No collections files found in data directory
```
**Solution**: Run the data fetching operations first to generate the required files.

### Getting Help

If you encounter issues:
1. Check the logs for detailed error messages
2. Ensure your API key is valid and has sufficient permissions
3. Verify your Node.js version is 18 or higher
4. Check the [troubleshooting section](#troubleshooting) above

## 📊 Use Cases

### **Investment Research**
- Identify high-value holders across multiple collections
- Analyze holder patterns and trends
- Generate investment-ready data reports

### **Market Analysis**
- Track holder distribution across collections
- Monitor cross-collection holder behavior
- Analyze market concentration and diversity

### **Data Science**
- Large-scale holder data analysis
- Pattern recognition and trend analysis
- Statistical modeling and predictions

The application is designed for professional use in Bitcoin inscription analysis and provides a solid foundation for advanced research and investment strategies. 