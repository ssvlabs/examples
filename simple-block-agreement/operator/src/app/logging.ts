import { tokenMap } from '../config'
import { BApp, Strategy, StrategyID, Token } from './app_interface'
import { Table } from 'console-table-printer'

export const RED = '\x1b[31m'
export const GREEN = '\x1b[32m'
export const YELLOW = '\x1b[33m'
export const BLUE = '\x1b[34m'
export const MAGENTA = '\x1b[35m'
export const CYAN = '\x1b[36m'
export const RESET = '\x1b[0m'
export const colors = [RED, GREEN, YELLOW, BLUE, MAGENTA, CYAN]

// 🔹 Log BApp Summary
export function logBAppSummary(bApp: BApp, strategies: Strategy[]): void {
  console.log(`${CYAN}📊 BApp Summary${RESET}`)
  const summaryTable = new Table({
    columns: [
      { name: 'Metric', alignment: 'left', color: 'cyan' },
      { name: 'Value', alignment: 'right' },
    ],
  })

  summaryTable.addRow({ Metric: 'Address', Value: bApp.address })
  summaryTable.addRow({ Metric: 'Validator Balance Significance', Value: bApp.validatorBalanceSignificance })
  summaryTable.addRow({
    Metric: 'Tokens',
    Value: bApp.tokens.map((t) => tokenMap[t.token.toLowerCase()] || t.token).join(', '),
  })
  summaryTable.addRow({ Metric: 'Strategies', Value: strategies.length })
  summaryTable.addRow({
    Metric: 'Total Validator Balance',
    Value: strategies.reduce((acc, s) => acc + s.validatorBalance, 0) + ' ETH',
  })
  summaryTable.printTable()
}

export function logToken(token: Token, message: string): void {
  const color = getColorForToken(token)
  const tokenSymbol = TokenSymbol(token)
  console.log(`${color}[💲 Token ${tokenSymbol}]${colorReset()} ${message}`)
}

export function logVB(message: string): void {
  const color = getColorForValidatorBalance()
  console.log(`${color}[🔑 Validator Balance]${colorReset()} ${message}`)
}

export function logFinalWeight(message: string): void {
  const color = getColorForFinalWeight()
  console.log(`${color}[⚖️  Final Weight]${colorReset()} ${message}`)
}

export function logTokenStrategy(token: Token, strategy: StrategyID, message: string): void {
  logToken(token, `${getColorForStrategy(strategy)}[🧍‍♂️ strategy ${strategy}]${colorReset()} ${message}`)
}

export function logVBStrategy(strategy: StrategyID, message: string): void {
  logVB(`${getColorForStrategy(strategy)}[🧍‍♂️ strategy ${strategy}]${colorReset()} ${message}`)
}

export function logFinalWeightStrategy(strategy: StrategyID, message: string): void {
  logFinalWeight(`${getColorForStrategy(strategy)}[🧍‍♂️ strategy ${strategy}]${colorReset()} ${message}`)
}

export function getColorForToken(token: string): string {
  let hash = 0
  for (let i = 0; i < token.length; i++) {
    hash = token.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colorIndex = Math.abs(hash) % colors.length
  return colors[colorIndex]
}

export function getColorForValidatorBalance(): string {
  return CYAN
}

export function getColorForFinalWeight(): string {
  return MAGENTA
}

export function getColorForStrategy(id: number): string {
  return colors[id % colors.length]
}

export function colorReset(): string {
  return RESET
}

export function logStrategy(id: StrategyID, message: string): void {
  const color = getColorForStrategy(id)
  console.log(`${color}[🧍‍♂️ strategy ${id}] ${colorReset()} ${message}`)
}

export function TokenSymbol(token: Token): string {
  if (token == '0x68a8ddd7a59a900e0657e9f8bbe02b70c947f25f') {
    return 'SSV'
  }
  return token
}
