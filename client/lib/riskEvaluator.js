// client/lib/riskEvaluator.js
function clamp(v, a, b) { 
  return Math.max(a, Math.min(b, v)); 
}

function computeHealthMultiplier(conditions = [], medications = "") {
  if (!conditions || conditions.length === 0 || (conditions.length === 1 && conditions[0] === 'None')) {
    return 1.0;
  }
  const count = conditions.filter(c => c !== "None").length;
  let mult = 1.0 + (0.2 * count);
  if (medications && medications.trim().length > 0) {
    mult += 0.1;
  }
  return clamp(mult, 1.0, 1.6);
}

/**
 * Computes a health and fatigue risk score for construction workers
 * @param {Object} input - Worker data
 * @param {string|number} input.worker_id - Worker ID
 * @param {number} input.age - Worker age
 * @param {number} input.total_hours_worked - Total hours worked
 * @param {number} [input.rest_minutes_last_24h] - Rest minutes in last 24 hours
 * @param {number} [input.rest_minutes] - Rest minutes (fallback)
 * @param {string[]} [input.health_conditions] - Array of health conditions
 * @param {string} [input.medications] - Medications list
 * @param {number} [input.heart_rate_bpm] - Heart rate in BPM
 * @param {number} [input.temperature_C] - Temperature in Celsius
 * @param {number} [input.systolic_bp] - Systolic blood pressure
 * @param {number} [input.diastolic_bp] - Diastolic blood pressure
 * @returns {Object} Risk assessment result
 */
function computeRiskScore(input) {
  const age = Number(input.age || 0);
  const hours = Number(input.total_hours_worked || 0);
  const restMinutes = Number(input.rest_minutes_last_24h ?? input.rest_minutes ?? 480);
  const conds = input.health_conditions || [];
  const meds = input.medications || "";
  const hr = Number(input.heart_rate_bpm || 0);
  const temp = Number(input.temperature_C || 0);
  const sys = Number(input.systolic_bp || 0);
  const dia = Number(input.diastolic_bp || 0);

  // Age adds 0–30 points
  // Risk increases for workers under 30 or over 70
  const ageScore = clamp(((age - 30) / (70 - 30)) * 30, 0, 30);

  // Hours worked adds 0–30 points
  // Risk increases for work beyond 8 hours, max risk at 12+ hours
  const hoursScore = hours <= 8 ? 0 : clamp(((hours - 8) / (12 - 8)) * 30, 0, 30);

  // Rest time adds 0–20 points
  // Less than 6 hours (360 min) = high risk, less than 8 hours (480 min) = moderate risk
  let restScore = 0;
  if (restMinutes < 360) {
    restScore = 20;
  } else if (restMinutes < 480) {
    restScore = 10;
  }

  // Optional vitals 0–20 points
  let vitalsScore = 0;
  if (hr > 120) {
    vitalsScore += 15;
  } else if (hr > 100) {
    vitalsScore += 10;
  }
  if (temp > 38.5) {
    vitalsScore += 12;
  } else if (temp > 37.5) {
    vitalsScore += 7;
  }
  if (sys > 160 || dia > 100) {
    vitalsScore += 12;
  } else if (sys > 140 || dia > 90) {
    vitalsScore += 8;
  }
  vitalsScore = clamp(vitalsScore, 0, 20);

  // Compute raw risk score (0-100)
  const raw = clamp(ageScore + hoursScore + restScore + vitalsScore, 0, 100);
  
  // Apply health conditions multiplier
  const mult = computeHealthMultiplier(conds, meds);
  const score = clamp(Math.round(raw * mult), 0, 100);

  // Determine alert level
  let level = "ok";
  if (score <= 30) {
    level = "ok";
  } else if (score <= 60) {
    level = "watch";
  } else if (score <= 80) {
    level = "warning";
  } else {
    level = "critical";
  }

  // Generate recommended actions based on alert level
  const actions = [];
  if (level === "ok") {
    actions.push("Maintain hydration and standard rest schedule.");
  } else if (level === "watch") {
    actions.push("Add 15-minute rest and verify hydration.");
    actions.push("Supervisor review at shift end.");
  } else if (level === "warning") {
    actions.push("Immediate 30-minute rest and vitals recheck.");
    actions.push("Supervisor to adjust next shift workload.");
  } else {
    actions.push("Stop work immediately and initiate medical check.");
    actions.push("Notify supervisor and emergency contact.");
  }

  // Build detailed reasons array
  const reasons = [];
  if (ageScore > 0) {
    reasons.push(`Age (${age} years) contributes ${Math.round(ageScore)} risk points`);
  }
  if (hoursScore > 0) {
    reasons.push(`Extended work hours (${hours}h) contributes ${Math.round(hoursScore)} risk points`);
  }
  if (restScore > 0) {
    reasons.push(`Insufficient rest (${restMinutes} min) contributes ${restScore} risk points`);
  }
  if (vitalsScore > 0) {
    const vitalsDetails = [];
    if (hr > 0) vitalsDetails.push(`HR: ${hr} bpm`);
    if (temp > 0) vitalsDetails.push(`Temp: ${temp}°C`);
    if (sys > 0 || dia > 0) vitalsDetails.push(`BP: ${sys}/${dia}`);
    reasons.push(`Vitals ${vitalsDetails.join(", ")} contribute ${vitalsScore} risk points`);
  }
  
  const conditionCount = conds.filter(c => c !== "None").length;
  if (conditionCount > 0) {
    reasons.push(`${conditionCount} health condition(s) apply ${mult.toFixed(2)}x multiplier`);
  } else {
    reasons.push("No health conditions - 1.0x multiplier");
  }
  
  if (meds && meds.trim().length > 0) {
    reasons.push("Medications present - additional 0.1x multiplier applied");
  }

  return {
    worker_id: input.worker_id || null,
    score,
    alert_level: level,
    reasons,
    recommended_actions: actions
  };
}

export { computeRiskScore };

