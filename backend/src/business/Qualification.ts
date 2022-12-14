import { roundTo } from "@libs/MathHelpers";
import { CustomerResponse } from "src/types/customerResponse";
import { getDebits } from "./Debits";
import { PotentialCustomer } from "./interfaces/PotentialCustomer";
import scoreTable from "./scores.json";

const debitsForInterview = 50;
const debitsFor1_15_charged = 75;
const debitsFor1_25_charged = 100;
const maxCharged = 1.25;
const basicCharged = 1.15;
const decimals = 2;

export const getQualification = (
  customer: PotentialCustomer
): CustomerResponse => {
  try {
    const bmi = getBMI(customer);
    const debits = getDebits(customer, bmi);
    const needInterview = debits > debitsForInterview;
    const amountTocharged = getAmountToCharged(debits);

    const score = scoreTable.find(
      (score) =>
        score.gender === customer.gender &&
        score.smoker === customer.hasSmoked &&
        customer.age >= score.minAge &&
        customer.age < score.maxAge
    );

    if (!score) {
      throw new Error("There are not score configuration for this customer");
    }

    const rateAnnual = amountTocharged * score.cost * customer.policyrequested;
    const ratePerMonth = rateAnnual / 12;

    return {
      name: customer.name,
      BMI: bmi,
      score: debits,
      needInterview,
      monthlyFee: roundTo(ratePerMonth, decimals),
      riskLevel: getRiskLevel(amountTocharged),
    };
  } catch (e) {
    throw {
      name: customer.name,
      message:
        e.message ||
        "We could not process this register, please validate the correct values",
    };
  }
};

const getAmountToCharged = (debits: number): number => {
  if (debits > debitsFor1_25_charged) return maxCharged;
  if (debits > debitsFor1_15_charged) return basicCharged;
  return 1;
};

const getRiskLevel = (charged: number): number => {
  switch (charged) {
    case maxCharged:
      return 2;
    case basicCharged:
      return 1;
    default:
      return 0;
  }
};

const getBMI = (customer: PotentialCustomer): number => {
  return roundTo(
    customer.weight / Math.pow(customer.height / 100, 2),
    decimals
  );
};

//Asumptions
/**
 * The min age is less and iqual
 * the max age is only less
 * height on centimeters
 * weight on kg
 */
