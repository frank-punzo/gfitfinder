# StyleSeek

StyleSeek is an AI-powered fashion assistant web application that helps users identify clothing items from photos and find where to buy them.

Built with **React**, **Tailwind CSS**, and the **Google Gemini API**, StyleSeek leverages multimodal AI to analyze outfits, detect specific garments, and generate smart shopping links to major retailers using Google Search Grounding.

## 🌟 Features

-   **Visual Analysis**: Upload any photo to identify clothing items (tops, bottoms, shoes, accessories).
-   **Style Detection**: Automatically determines the overall style of the outfit (e.g., "Casual Streetwear", "Bohemian Chic").
-   **Smart Search**: Uses Gemini with Google Search Grounding to generate valid, robust search URLs for major retailers (Nordstrom, Amazon, Zara, etc.).
-   **Mobile-First UI**: A sleek, responsive design modeled after a modern mobile app interface.

## 🏗 Architecture

The application follows a client-side architecture using the Google GenAI SDK to communicate directly with Gemini models.

```mermaid
graph TD
    User([User])
    UI[ClothingFinder Component]
    Service[Gemini Service]
    GeminiVision[Gemini 2.5 Flash\n(Vision Model)]
    GeminiSearch[Gemini 2.5 Flash\n(Search Grounding)]

    %% Flow
    User -- Uploads Image --> UI
    UI -- Base64 Image --> Service
    
    subgraph Analysis Phase
    Service -- Analyze Image --> GeminiVision
    GeminiVision -- JSON: Items & Style --> Service
    end
    
    Service -- Analysis Results --> UI
    
    subgraph Search Phase
    UI -- Loop: For each Item --> Service
    Service -- Generate Search URLs --> GeminiSearch
    GeminiSearch -- JSON: Retailer Links --> Service
    end
    
    Service -- Product Links --> UI
    UI -- Render Results --> User
```

### Component Overview

1.  **`components/ClothingFinder.tsx`**: The main UI controller. It handles:
    *   File uploads and drag-and-drop interactions.
    *   State management (loading states, results, errors).
    *   Rendering the "Phone Frame" UI and result cards.
2.  **`services/geminiService.ts`**: The API layer.
    *   `analyzeImageWithGemini`: Sends the image to Gemini 2.5 Flash to extract a structured JSON list of clothing items.
    *   `searchProductsWithGemini`: Uses Gemini with the **Google Search Tool** to construct valid search query URLs for retailers based on the item description.
3.  **`types.ts`**: Shared TypeScript definitions for type safety across the app.

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18+ recommended)
*   A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/).

### Installation

1.  **Clone the repository** (if applicable) or download the source code.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Set up your API Key**:
    *   If running locally with a build tool like Vite/Parcel, create a `.env` file:
        ```
        API_KEY=your_gemini_api_key_here
        ```
    *   *Note: In the provided environment, the API key is injected automatically via `process.env.API_KEY`.*

4.  **Run the application**:
    ```bash
    npm start
    ```

## 🛠 Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS (via CDN for simplicity in this demo)
*   **AI SDK**: `@google/genai`
*   **Fonts**: Instrument Sans, Playfair Display (Google Fonts)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
