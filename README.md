# Inscription Holder Analyzer

A comprehensive TypeScript application for analyzing Bitcoin inscription holders across collections using the BestInSlot API. This tool fetches collection data, analyzes holder patterns, and generates filtered reports for investment and analysis purposes.

## 🚀 Features

- **Collection Data Fetching**: Automatically retrieves all inscription collections from BestInSlot API
- **Holder Analysis**: Fetches detailed holder information for each collection
- **Cross-Collection Analysis**: Identifies wallets holding inscriptions across multiple collections
- **Smart Filtering**: Filters holders based on inscription count thresholds
- **Automated File Management**: Generates timestamped reports with automatic latest file detection
- **Rate Limiting**: Built-in delays to respect API rate limits
- **Comprehensive Logging**: Detailed logging with timestamps and context
- **Error Handling**: Robust error handling with graceful fallbacks

## 📊 Data Pipeline

```
1. Collection Fetching → 2. Holder Analysis → 3. Data Aggregation → 4. Filtering → 5. Report Generation
   
   ├── API: BestInSlot Collections
   ├── API: Collection Holders  
   ├── Merge holder data
   ├── Filter by criteria
   └── Generate timestamped reports
```

## 🏗️ Project Structure

```
src/
├── index.ts                 # Main application orchestrator
├── types/
│   └── index.ts            # TypeScript interfaces (ICollection, IHolder)
├── utils/
│   ├── logger.ts           # Advanced logging utility
│   └── delay.ts            # Rate limiting utility
└── __tests__/
    └── calculator.test.ts   # Unit tests

data/                        # Generated data files (gitignored)
├── collections-YYYY-MM-DDTHH-mm-ss-sssZ.json
├── holderSummary-YYYY-MM-DDTHH-mm-ss-sssZ.json
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
2. **Holder Summarization**: Analyzes holders across collections
3. **Data Filtering**: Applies filtering criteria (holders with >10 inscriptions)

### Individual Operations

You can also run specific operations by modifying the `main()` function in `src/index.ts`:

```typescript
// Fetch only collections
await fetchCollectionList();

// Analyze holders from existing collections
await summarizeHolders();

// Filter existing holder data
await filterHolders();
```

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run in development mode with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled JavaScript |
| `npm test` | Execute test suite |
| `npm run lint` | Check code quality |
| `npm run format` | Format code with Prettier |
| `npm run clean` | Remove build artifacts |

## 📄 Output Files

The application generates three types of timestamped files:

### 1. Collections Data
**File**: `collections-YYYY-MM-DDTHH-mm-ss-sssZ.json`
- Raw collection data from BestInSlot API
- Includes metadata, floor prices, volumes, and supply information

### 2. Holder Summary
**File**: `holderSummary-YYYY-MM-DDTHH-mm-ss-sssZ.json`
- Aggregated holder data across all collections
- Format: `{ "wallet_address": ["inscription_id1", "inscription_id2", ...] }`

### 3. Filtered Results
**File**: `FinalResult-YYYY-MM-DDTHH-mm-ss-sssZ.json`
- Filtered holders meeting criteria (>10 inscriptions)
- Ready for analysis and investment research

## 🔧 Configuration

### API Rate Limiting
Modify delay settings in the code:
```typescript
await delay(1500); // 1.5 second delay between requests
```

### Filtering Criteria
Adjust holder filtering thresholds:
```typescript
if(inscriptions && inscriptions.length > 10) { // Change threshold here
  filteredHoldersSummary[wallet] = inscriptions;
}
```

## 📊 Data Structures

### Collection Interface
```typescript
interface ICollection {
  name: string;
  slug: string;
  inscription_icon_id: string;
  supply: string;
  min_number: number;
  median_number: number;
  max_number: number;
  floor_price: number | null;
  vol_24h_in_btc: number;
  vol_7d_in_btc: number;
  marketcap: number;
  // ... additional fields
}
```

### Holder Interface
```typescript
interface IHolder {
  wallet: string;
  inscription_ids: string[];
}
```

## 🔒 Security & Best Practices

- ✅ **API Keys**: Stored securely in environment variables
- ✅ **Rate Limiting**: Respects API rate limits with delays
- ✅ **Error Handling**: Comprehensive error handling throughout
- ✅ **Type Safety**: Full TypeScript type checking enabled
- ✅ **Data Validation**: Input validation and error recovery
- ✅ **Logging**: Detailed operation logging for debugging

## 🧪 Testing

Run the test suite:
```bash
npm test
```

For watch mode during development:
```bash
npm run test:watch
```

## 🔍 Monitoring & Debugging

The application provides detailed logging:

```
[2025-01-24T06:30:45.123Z] [INFO] [Main] Starting TypeScript application...
[2025-01-24T06:30:45.124Z] [INFO] [Main] Fetching collection list from https://api.bestinslot.xyz/...
[2025-01-24T06:30:46.234Z] [INFO] [Main] Fetched 100 collections
[2025-01-24T06:30:46.235Z] [INFO] [Main] Collection list fetched
[2025-01-24T06:30:46.236Z] [INFO] [Main] Using latest collections file: collections-2025-01-24T06-30-45-123Z.json
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and TypeScript patterns
- Add tests for new features
- Run `npm run lint` and `npm test` before committing
- Update documentation for new features

## 📈 Use Cases

- **Investment Research**: Identify power users and whale wallets
- **Market Analysis**: Understand holder distribution patterns
- **Collection Analytics**: Compare holder patterns across collections
- **Portfolio Tracking**: Monitor inscription holder movements
- **Research & Development**: Analyze inscription ecosystem trends

## 🐛 Troubleshooting

### Common Issues

**API Key Error**
```
Error: BEST_IN_SLOT API key is required
```
*Solution*: Ensure your `.env` file contains a valid API key

**No Collections Files Found**
```
Error: No collections files found in data directory
```
*Solution*: Run the collection fetching step first: `fetchCollectionList()`

**Rate Limiting**
```
API request failed: 429 Too Many Requests
```
*Solution*: Increase delay times in the code or wait before retrying

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details

## 📞 Contact

For questions, support, or collaboration opportunities:

- **Email**: [michalstefanow.marek@gmail.com](mailto:michalstefanow.marek@gmail.com)
- **Telegram**: [@mylord1_1](https://t.me/mylord1_1)

Feel free to reach out for:
- Technical support and troubleshooting
- Feature requests and suggestions
- Collaboration on Bitcoin inscription projects
- Custom analysis requirements

## 🔗 Related Resources

- [BestInSlot API Documentation](https://docs.bestinslot.xyz)
- [Bitcoin Inscriptions Guide](https://docs.ordinals.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

---

**Made with ❤️ for the Bitcoin Inscriptions ecosystem** 