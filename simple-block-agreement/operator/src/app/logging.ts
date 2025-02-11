import { config, tokenMap } from '../config'
import { BApp, Strategy, StrategyID, StrategyToken, Address } from './app_interface'
import { Table } from 'console-table-printer'

export const RED = '\x1b[31m'
export const GREEN = '\x1b[32m'
export const YELLOW = '\x1b[33m'
export const BLUE = '\x1b[34m'
export const MAGENTA = '\x1b[35m'
export const CYAN = '\x1b[36m'
export const RESET = '\x1b[0m'
export const colors = [RED, GREEN, YELLOW, BLUE, MAGENTA, CYAN]

export function logBAppSummary(bApp: BApp, strategies: Strategy[]): void {
  const summaryTable = new Table({
    columns: [
      { name: 'Metric', alignment: 'left', color: 'cyan' },
      { name: 'Value', alignment: 'right' },
    ],
    title: '📊 BApp Overview',
  })

  const totalValidatorBalance = strategies.reduce((acc, s) => acc + s.validatorBalance, 0)
  const getTokenTotalAmount = (token: string) =>
    strategies.reduce((acc, s) => {
      const strategyToken = s.tokens.find((t: StrategyToken) => t.address === token)
      return acc + (strategyToken ? (strategyToken.amount * strategyToken.obligationPercentage) / 10000 / 10 ** 18 : 0)
    }, 0)

  const tokenSummary =
    bApp.tokens.length > 0
      ? bApp.tokens
          .map((t) => {
            const symbol = tokenMap[t.address.toLowerCase()].symbol || t.address
            const totalAmount = getTokenTotalAmount(t.address)
            return `${symbol} (${totalAmount.toLocaleString()})`
          })
          .join(', ')
      : 'None'

  summaryTable.addRow({ Metric: 'Address', Value: bApp.address })
  summaryTable.addRow({ Metric: 'Validator Balance Significance', Value: bApp.validatorBalanceSignificance })
  summaryTable.addRow({ Metric: 'Tokens', Value: tokenSummary })
  summaryTable.addRow({ Metric: 'Strategies', Value: strategies.length })
  summaryTable.addRow({ Metric: 'Total Validator Balance', Value: `${totalValidatorBalance.toLocaleString()} ETH` })

  summaryTable.printTable()
}

export function logValidatorBalanceTable(strategies: Strategy[]): void {
  console.log('\n')

  const validatorTable = new Table({
    columns: [
      { name: 'Strategy', alignment: 'center', color: 'blue' },
      { name: 'Validator Balance', alignment: 'right', color: 'green' },
      { name: 'Weight (%)', alignment: 'right', color: 'magenta' },
    ],
    title: '🔑 Validator Balance Distribution',
  })

  const totalValidatorBalance = strategies.reduce((acc, s) => acc + s.validatorBalance, 0)

  strategies.forEach((strategy) => {
    const weight = totalValidatorBalance > 0 ? (strategy.validatorBalance / totalValidatorBalance) * 100 : 0

    validatorTable.addRow({
      Strategy: strategy.id,
      'Validator Balance': `${strategy.validatorBalance.toLocaleString()} ETH`,
      'Weight (%)': `${weight.toFixed(2)}%`,
    })
  })

  // Add total validator balance row
  validatorTable.addRow(
    {
      Strategy: 'TOTAL',
      'Validator Balance': `${totalValidatorBalance.toLocaleString()} ETH`,
      'Weight (%)': '100.00%',
    },
    { color: 'yellow' },
  )

  validatorTable.printTable()
  console.log('\n')
}

export function logTokenWeightSummary(tokenAddress: string, beta: number, strategies: Strategy[]): void {
  console.log('\n')

  const tokenSymbol = tokenMap[tokenAddress.toLowerCase()].symbol || tokenAddress

  const tokenTable = new Table({
    columns: [
      { name: 'Strategy', alignment: 'center', color: 'blue' },
      { name: 'Obligation (%)', alignment: 'right', color: 'cyan' },
      { name: 'Balance', alignment: 'right', color: 'green' },
      { name: 'Obligated Balance', alignment: 'right', color: 'yellow' },
      { name: 'Risk', alignment: 'right', color: 'magenta' },
      { name: 'Weight', alignment: 'right', color: 'red' },
    ],
    title: `💲 Token Weight Summary for ${tokenSymbol}`,
  })

  // Calculate total obligated balance for this token
  const totalObligatedBalance = strategies.reduce((acc, s) => {
    const strategyToken = s.tokens.find((t: StrategyToken) => t.address === tokenAddress)
    return acc + (strategyToken ? strategyToken.amount * (strategyToken.obligationPercentage / 100) : 0)
  }, 0)

  strategies.forEach((strategy) => {
    const strategyToken = strategy.tokens.find((t: StrategyToken) => t.address === tokenAddress)
    if (!strategyToken) return

    const obligatedBalance = strategyToken.amount * (strategyToken.obligationPercentage / 10000)
    const obligationParticipation = totalObligatedBalance > 0 ? obligatedBalance / totalObligatedBalance : 0
    const weight = obligationParticipation / Math.max(1, strategyToken.risk) ** beta
    const formatBalance = (balance: number) => (balance / 10 ** config.tokenMap[tokenAddress].decimals).toLocaleString()

    tokenTable.addRow({
      Strategy: strategy.id,
      'Obligation (%)': `${(strategyToken.obligationPercentage / 100).toFixed(2)}%`,
      Balance: `${formatBalance(strategyToken.amount)} ${tokenSymbol}`,
      'Obligated Balance': `${formatBalance(obligatedBalance)} ${tokenSymbol}`,
      Risk: (strategyToken.risk / 100).toFixed(2).toLocaleString(),
      Weight: weight.toExponential(2),
    })
  })

  tokenTable.printTable()
}

export function logToken(token: Address, message: string): void {
  const color = getColorForToken(token)
  console.log(token)
  const tokenSymbol = config.tokenMap[token].symbol || token
  console.log(`${color}[💲 Token ${tokenSymbol}]${colorReset()} ${message}`)
}

export function logVB(message: string): void {
  const color = getColorForValidatorBalance()
  console.log(`${color}[🔑 Validator Balance]${colorReset()} ${message}`)
}

export function logFinalWeight(message: string): void {
  const color = getColorForFinalWeight()
  console.log(`${color}[⚖️ Final Weight]${colorReset()} ${message}`)
}

export function logTokenStrategy(token: Address, strategy: StrategyID, message: string): void {
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
  console.log(`${color}[🧍strategy ${id}] ${colorReset()} ${message}`)
}
