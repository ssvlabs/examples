import { config, tokenMap } from './config'
import { BApp, Strategy, StrategyID, StrategyToken, Address } from './types/app-interface'
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
      return (
        acc +
        (strategyToken
          ? (strategyToken.amount * strategyToken.obligationPercentage) /
            100 /
            10 ** tokenMap[strategyToken.address].decimals
          : 0)
      )
    }, 0)

  const tokenSummary =
    bApp.tokens.length > 0
      ? bApp.tokens
          .map((t) => {
            const symbol = tokenMap[t.address.toLowerCase()].symbol || t.address
            const totalAmount = getTokenTotalAmount(t.address)
            return `${symbol} (Amount: ${totalAmount.toLocaleString()} / Significance: ${t.significance})`
          })
          .join(', ')
      : 'None'

  summaryTable.addRow({ Metric: 'Address', Value: bApp.address })
  summaryTable.addRow({ Metric: 'Tokens', Value: tokenSummary })
  summaryTable.addRow({ Metric: 'Strategies', Value: strategies.length })
  summaryTable.addRow({ Metric: 'Total Validator Balance', Value: `${totalValidatorBalance.toLocaleString()} ETH` })
  summaryTable.addRow({ Metric: 'Validator Balance Significance', Value: bApp.validatorBalanceSignificance })
  summaryTable.printTable()
}

export function logValidatorBalanceTable(strategies: Strategy[]): void {
  const validatorTable = new Table({
    columns: [
      { name: 'Strategy', alignment: 'center', color: 'blue' },
      { name: 'Validator Balance', alignment: 'right', color: 'green' },
      { name: 'Weight (%)', alignment: 'right', color: 'magenta' },
    ],
    title: '🔑 Validator Weights',
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

  validatorTable.addRow(
    {
      Strategy: 'TOTAL',
      'Validator Balance': `${totalValidatorBalance.toLocaleString()} ETH`,
      'Weight (%)': '100.00%',
    },
    { color: 'yellow' },
  )

  console.log()
  validatorTable.printTable()
  console.log()
}

export function logTokenWeightSummary(tokenAddress: string, beta: number, strategies: Strategy[]): void {
  const tokenSymbol = tokenMap[tokenAddress.toLowerCase()].symbol || tokenAddress

  const tokenTable = new Table({
    columns: [
      { name: 'Strategy', alignment: 'center', color: 'blue' },
      { name: 'Balance', alignment: 'right', color: 'green' },
      { name: 'Obligation (%)', alignment: 'right', color: 'cyan' },
      { name: 'Obligated Balance', alignment: 'right', color: 'yellow' },
      { name: 'Risk', alignment: 'right', color: 'magenta' },
    ],
    title: `💲 BApp Token Weight Summary for ${tokenSymbol}`,
  })

  strategies.forEach((strategy) => {
    const strategyToken = strategy.tokens.find((t: StrategyToken) => t.address === tokenAddress)
    if (!strategyToken) return

    const obligatedBalance = (strategyToken.amount * strategyToken.obligationPercentage) / 100
    const formatBalance = (balance: number) => (balance / 10 ** config.tokenMap[tokenAddress].decimals).toLocaleString()

    tokenTable.addRow({
      Strategy: strategy.id,
      'Obligation (%)': `${strategyToken.obligationPercentage.toFixed(2)}%`,
      Balance: `${formatBalance(strategyToken.amount)} ${tokenSymbol}`,
      'Obligated Balance': `${formatBalance(obligatedBalance)} ${tokenSymbol}`,
      Risk: `${strategyToken.risk.toFixed(2).toLocaleString()}%`,
    })
  })
  console.log()
  tokenTable.printTable()
  console.log()
}

const toPercentage = (value: number) => (value * 100).toFixed(2)

export function logNormalizedFinalWeights(
  finalWeights: Map<StrategyID, number>,
  rawWeights: Map<StrategyID, number>,
): void {
  const weightTable = new Table({
    columns: [
      { name: 'Strategy', alignment: 'center', color: 'blue' },
      { name: 'Raw Weight', alignment: 'right', color: 'red' },
      { name: 'Norm. Weight', alignment: 'right', color: 'magenta' },
      { name: 'Weight (%)', alignment: 'right', color: 'yellow' },
    ],
    title: '📊 Normalized Final Weights',
  })

  for (const [strategy, weight] of finalWeights.entries()) {
    weightTable.addRow({
      Strategy: strategy,
      'Raw Weight': rawWeights.get(strategy)?.toExponential(2),
      'Norm. Weight': weight.toExponential(2),
      'Weight (%)': `${toPercentage(weight)}%`,
    })
  }
  console.log()
  weightTable.printTable()
  console.log()
}

export function logStrategyTokenWeights(
  tokenAddress: string,
  tokenWeights: Map<StrategyID, Map<Address, number>>,
): void {
  const tokenEntry = Object.values(tokenMap).find((t) => t.address === tokenAddress)
  if (!tokenEntry) {
    console.error(`❌ Token ${tokenAddress} not found in tokenMap.`)
    return
  }

  let totalWeight = 0
  tokenWeights.forEach((strategyTokens) => {
    if (strategyTokens.has(tokenAddress)) {
      totalWeight += strategyTokens.get(tokenAddress)!
    }
  })

  const tokenWeightTable = new Table({
    columns: [
      { name: 'Strategy', alignment: 'center', color: 'blue' },
      { name: 'Raw Weight', alignment: 'right', color: 'magenta' },
      { name: 'Norm. Weight', alignment: 'right', color: 'red' },
      { name: 'Weight (%)', alignment: 'right', color: 'yellow' },
    ],
    title: `\n📊 Normalized Weights for ${tokenMap[tokenAddress].symbol}`,
  })

  for (const [strategy, strategyTokens] of tokenWeights.entries()) {
    if (!strategyTokens.has(tokenAddress)) continue // Skip strategies without this token

    const rawWeight = strategyTokens.get(tokenAddress)!
    const normalizedWeight = totalWeight > 0 ? rawWeight / totalWeight : 0

    tokenWeightTable.addRow({
      Strategy: strategy,
      'Raw Weight': rawWeight.toExponential(2),
      'Norm. Weight': normalizedWeight.toExponential(2),
      'Weight (%)': `${toPercentage(normalizedWeight)}%`,
    })
  }
  console.log()
  tokenWeightTable.printTable()
  console.log()
}

export function logToken(token: Address, message: string): void {
  const color = getColorForToken(token)
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
  logToken(token, `${getColorForStrategy(strategy)}[🧍strategy ${strategy}]${colorReset()} ${message}`)
}

export function logVBStrategy(strategy: StrategyID, message: string): void {
  logVB(`${getColorForStrategy(strategy)}[🧍strategy ${strategy}]${colorReset()} ${message}`)
}

export function logFinalWeightStrategy(strategy: StrategyID, message: string): void {
  logFinalWeight(`${getColorForStrategy(strategy)}[🧍strategy ${strategy}]${colorReset()} ${message}`)
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
