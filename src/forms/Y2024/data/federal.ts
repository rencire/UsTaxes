import { FilingStatus } from 'ustaxes/core/data'
import { linear, Piecewise } from 'ustaxes/core/util'

export const CURRENT_YEAR = 2024

interface TaggedAmount {
  name: string
  amount: number
}

interface Brackets {
  brackets: number[]
}

interface Deductions {
  deductions: TaggedAmount[]
  exemptions: TaggedAmount[]
}

interface Rates {
  rates: number[]
}

interface FederalBrackets {
  ordinary: Rates & { status: { [key in FilingStatus]: Brackets & Deductions } }
  longTermCapGains: Rates & { status: { [key in FilingStatus]: Brackets } }
}

// Tax brackets can be most easily found via google
// The standard deduction amounts with the allowances can be most
// easily found at the end of 1040-SR
const federalBrackets: FederalBrackets = {
  ordinary: {
    rates: [10, 12, 22, 24, 32, 35, 37],
    status: {
      [FilingStatus.S]: {
        brackets: [11600, 47150, 100525, 191950, 243725, 609350],
        deductions: [
          {
            name: 'Standard Deduction (Single)',
            amount: 14600
          },
          {
            name: 'Standard Deduction (Single) with 1 age or blindness allowance',
            amount: 16550
          },
          {
            name: 'Standard Deduction (Single) with 2 age or blindness allowances',
            amount: 18500
          }
        ],
        exemptions: [
          {
            name: 'Standard Exemption (Single)',
            amount: 0
          }
        ]
      },
      [FilingStatus.MFJ]: {
        brackets: [23200, 94300, 201050, 383900, 487450, 731200],
        deductions: [
          {
            name: 'Standard Deduction (Married)',
            amount: 29200
          },
          {
            name: 'Standard Deduction (Married) with 1 age or blindness allowance',
            amount: 30800
          },
          {
            name: 'Standard Deduction (Married) with 2 age or blindness allowances',
            amount: 32400
          },
          {
            name: 'Standard Deduction (Married) with 3 age or blindness allowances',
            amount: 34000
          },
          {
            name: 'Standard Deduction (Married) with 4 age or blindness allowances',
            amount: 35600
          }
        ],
        exemptions: [
          {
            name: 'Standard Exemption (Married)',
            amount: 0
          }
        ]
      },
      [FilingStatus.W]: {
        brackets: [23200, 94300, 201050, 383900, 487450, 731200],
        deductions: [
          {
            name: 'Standard Deduction (Widowed)',
            amount: 29200
          },
          {
            name: 'Standard Deduction (Widowed) with 1 age or blindness allowance',
            amount: 30800
          },
          {
            name: 'Standard Deduction (Widowed) with 2 age or blindness allowances',
            amount: 32400
          }
        ],
        exemptions: [
          {
            name: 'Standard Exemption (Widowed)',
            amount: 0
          }
        ]
      },
      [FilingStatus.MFS]: {
        brackets: [11600, 47150, 100525, 191950, 243725, 365600],
        deductions: [
          {
            name: 'Standard Deduction (Married Filing Separately)',
            amount: 14600
          },
          {
            name: 'Standard Deduction (Married Filing Separately) with 1 age or blindness allowance',
            amount: 16200
          },
          {
            name: 'Standard Deduction (Married Filing Separately) with 2 age or blindness allowances',
            amount: 17800
          },
          {
            name: 'Standard Deduction (Married Filing Separately) with 3 age or blindness allowances',
            amount: 19400
          },
          {
            name: 'Standard Deduction (Married Filing Separately) with 4 age or blindness allowances',
            amount: 21000
          }
        ],
        exemptions: [
          {
            name: 'Standard Exemption (Married Filing Separately)',
            amount: 0
          }
        ]
      },
      [FilingStatus.HOH]: {
        brackets: [16550, 63100, 100500, 191950, 243700, 609350],
        deductions: [
          {
            name: 'Standard Deduction (Head of Household)',
            amount: 21900
          },
          {
            name: 'Standard Deduction (Head of Household) with 1 age or blindness allowance',
            amount: 23850
          },
          {
            name: 'Standard Deduction (Head of Household) with 2 age or blindness allowances',
            amount: 25800
          }
        ],
        exemptions: [
          {
            name: 'Standard Exemption (Head of Household)',
            amount: 0
          }
        ]
      }
    }
  },
  longTermCapGains: {
    rates: [0, 15, 20],
    status: {
      [FilingStatus.S]: {
        brackets: [47025, 518900]
      },
      [FilingStatus.MFJ]: {
        brackets: [94050, 583750]
      },
      [FilingStatus.W]: {
        brackets: [94050, 583750]
      },
      [FilingStatus.MFS]: {
        brackets: [47025, 291850]
      },
      [FilingStatus.HOH]: {
        brackets: [63000, 551350]
      }
    }
  }
}

export const fica = {
  maxSSTax: 10459.2,
  maxIncomeSSTaxApplies: 168600,
  regularMedicareTaxRate: 1.45 / 100,
  additionalMedicareTaxRate: 0.9 / 100,
  additionalMedicareTaxThreshold: (filingStatus: FilingStatus): number => {
    switch (filingStatus) {
      case FilingStatus.MFJ: {
        return 250000
      }
      case FilingStatus.MFS: {
        return 125000
      }
      default: {
        return 200000 // Single, Head of Household, Widower
      }
    }
  }
}

// Net Investment Income Tax calculated on form 8960
export const netInvestmentIncomeTax = {
  taxRate: 0.038, // 3.8%
  taxThreshold: (filingStatus: FilingStatus): number => {
    switch (filingStatus) {
      case FilingStatus.MFJ: {
        return 250000
      }
      case FilingStatus.W: {
        return 250000
      }
      case FilingStatus.MFS: {
        return 125000
      }
      default: {
        return 200000 // Single, Head of Household
      }
    }
  }
}

export const healthSavingsAccounts = {
  contributionLimit: {
    'self-only': 4150,
    family: 8300
  }
}

export const amt = {
  excemption: (
    filingStatus: FilingStatus,
    income: number
  ): number | undefined => {
    switch (filingStatus) {
      case FilingStatus.S:
        if (income <= 609350) {
          return 85700
        }
        break
      case FilingStatus.MFJ:
        if (income <= 1218700) {
          return 133300
        }
        break
      case FilingStatus.MFS:
        if (income <= 609350) {
          return 66650
        }
    }
    // TODO: Handle "Exemption Worksheet"
    return undefined
  },
  cap: (filingStatus: FilingStatus): number => {
    if (filingStatus === FilingStatus.MFS) {
      return 116300
    }
    return 232600
  }
}

// https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/earned-income-and-earned-income-tax-credit-eitc-tables#EITC%20Tables
// line 11 caps based on step one in instructions
const line11Caps = [19130, 48436, 53622, 57784] // Updated for 2024
const line11MfjCaps = [25760, 55529, 60411, 64573] // Updated for 2024

type Point = [number, number]

// Provided a list of points, create a piecewise function
// that makes linear segments through the list of points.
const toPieceWise = (points: Point[]): Piecewise =>
  points
    .slice(0, points.length - 1)
    .map((point, idx) => [point, points[idx + 1]])
    .map(([[x1, y1], [x2, y2]]) => ({
      // starting point     slope              intercept
      lowerBound: x1,
      f: linear((y2 - y1) / (x2 - x1), y1 - (x1 * (y2 - y1)) / (x2 - x1))
    }))

const unmarriedFormulas: Piecewise[] = (() => {
  const points: Point[][] = [
    [
      [0, 0],
      [8510, 600],
      [10640, 600],
      [19130, 0]
    ], // 0
    [
      [0, 0],
      [12750, 4168],
      [23390, 4168],
      [48436, 0]
    ], // 1
    [
      [0, 0],
      [17910, 6892],
      [23390, 6892],
      [53622, 0]
    ], // 2
    [
      [0, 0],
      [17910, 7754],
      [23390, 7754],
      [57784, 0]
    ] // 3 or more
  ]
  return points.map((ps: Point[]) => toPieceWise(ps))
})()

const marriedFormulas: Piecewise[] = (() => {
  const points: Point[][] = [
    [
      [0, 0],
      [8510, 600],
      [17750, 4168],
      [25760, 0]
    ], // 0
    [
      [0, 0],
      [12750, 4168],
      [30520, 4168],
      [55529, 0]
    ], // 1
    [
      [0, 0],
      [17910, 6892],
      [30520, 6892],
      [60411, 0]
    ], // 2
    [
      [0, 0],
      [17910, 7754],
      [30520, 7754],
      [64573, 0]
    ] // 3 or more
  ]
  return points.map((ps) => toPieceWise(ps))
})()

interface EICDef {
  caps: { [k in FilingStatus]: number[] | undefined }
  maxInvestmentIncome: number
  formulas: { [k in FilingStatus]: Piecewise[] | undefined }
}

export const QualifyingDependents = {
  childMaxAge: 17,
  qualifyingDependentMaxAge: 19,
  qualifyingStudentMaxAge: 24
}

export const EIC: EICDef = {
  // credit caps for number of children (0, 1, 2, 3 or more):
  // Step 1
  caps: {
    [FilingStatus.S]: line11Caps,
    [FilingStatus.W]: line11Caps,
    [FilingStatus.HOH]: line11Caps,
    [FilingStatus.MFS]: undefined,
    [FilingStatus.MFJ]: line11MfjCaps
  },
  maxInvestmentIncome: 11600, // Updated for 2024
  formulas: {
    [FilingStatus.S]: unmarriedFormulas,
    [FilingStatus.W]: unmarriedFormulas,
    [FilingStatus.HOH]: unmarriedFormulas,
    [FilingStatus.MFS]: undefined,
    [FilingStatus.MFJ]: marriedFormulas
  }
}

export default federalBrackets

// Constants used in the social security benefits worksheet
interface SocialSecurityBenefitsDef {
  caps: { [k in FilingStatus]: { l8: number; l10: number } }
}

// Updated for 2024 (assuming no changes from 2023, as these values often remain stable)
export const SSBenefits: SocialSecurityBenefitsDef = {
  caps: {
    [FilingStatus.S]: { l8: 25000, l10: 9000 },
    [FilingStatus.W]: { l8: 25000, l10: 9000 },
    [FilingStatus.HOH]: { l8: 25000, l10: 9000 },
    [FilingStatus.MFS]: { l8: 25000, l10: 9000 },
    [FilingStatus.MFJ]: { l8: 32000, l10: 12000 }
  }
}
