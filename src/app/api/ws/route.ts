import { WebSocketServer, WebSocket as WsWebSocket } from "ws"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { IncomingMessage } from "http"
import { Socket } from "net"

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY
const TWELVE_DATA_WS_URL = "wss://ws.twelvedata.com/v1/quotes/price"

// Store active WebSocket connections
const connections = new Map<string, WsWebSocket>()

interface WebSocketMessage {
  type: string;
  symbol?: string;
}

interface TwelveDataMessage {
  price: string;
  symbol: string;
}

export async function GET(req: Request) {
  if ((await headers()).get("upgrade") !== "websocket") {
    return new NextResponse("Expected Upgrade: websocket", { status: 426 })
  }

  const { response } = await new Promise<{ socket: WsWebSocket; response: Response }>((resolve) => {
    const wss = new WebSocketServer({ noServer: true })
    wss.on("connection", (ws) => {
      // Handle incoming messages
      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString()) as WebSocketMessage
          if (data.type === "subscribe" && data.symbol) {
            // Connect to Twelve Data WebSocket
            const twelveDataWs = new WsWebSocket(TWELVE_DATA_WS_URL)
            
            // Store the connection
            connections.set(data.symbol, twelveDataWs)

            // Handle Twelve Data WebSocket connection
            twelveDataWs.on("open", () => {
              // Subscribe to the symbol
              twelveDataWs.send(JSON.stringify({
                action: "subscribe",
                params: {
                  symbols: data.symbol,
                  apikey: TWELVE_DATA_API_KEY,
                },
              }))
            })

            // Forward price updates to the client
            twelveDataWs.on("message", (update: Buffer) => {
              const message = JSON.parse(update.toString()) as TwelveDataMessage
              ws.send(JSON.stringify(message))
            })

            // Handle errors
            twelveDataWs.on("error", (error: Error) => {
              console.error("Twelve Data WebSocket error:", error)
              ws.send(JSON.stringify({ error: "WebSocket error" }))
            })

            // Clean up on close
            twelveDataWs.on("close", () => {
              if (data.symbol) {
                connections.delete(data.symbol)
              }
            })
          } else if (data.type === "unsubscribe" && data.symbol) {
            const twelveDataWs = connections.get(data.symbol)
            if (twelveDataWs) {
              twelveDataWs.close()
              connections.delete(data.symbol)
            }
          }
        } catch (error) {
          console.error("Error handling WebSocket message:", error)
        }
      })

      // Handle client disconnection
      ws.on("close", () => {
        // Close all Twelve Data connections
        connections.forEach((twelveDataWs) => {
          twelveDataWs.close()
        })
        connections.clear()
      })
    })

    // Convert Request to IncomingMessage for handleUpgrade
    const reqSocket = (req as unknown as { socket: Socket }).socket
    const incomingMessage = req as unknown as IncomingMessage
    incomingMessage.socket = reqSocket

    wss.handleUpgrade(incomingMessage, reqSocket, Buffer.alloc(0), (ws) => {
      wss.emit("connection", ws, req)
      resolve({ socket: ws, response: new Response(null, { status: 101 }) })
    })
  })

  return response
} 