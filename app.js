const incidentSteps = [
  {
    label: 'Receive the goal',
    owner: 'Harness',
    phase: 'Intake',
    title: 'Turn the request into a run',
    description: 'The harness captures the user goal, constraints, identity, and a definition of success before asking the model what to do.',
    input: '“Investigate elevated API latency and recommend a mitigation. Do not roll back without approval.”',
    output: 'A run state with goal, boundaries, allowed tools, and a step budget.',
    why: 'A vague prompt alone cannot enforce permissions or tell the runner when the work is done.',
    state: 'Goal recorded; no tools have run.'
  },
  {
    label: 'Draft a plan',
    owner: 'Model',
    phase: 'Planning',
    title: 'Choose a route through uncertainty',
    description: 'The model proposes a small plan: establish the time window, inspect logs, compare deployments, then verify the likely cause.',
    input: 'Goal, current context, and tool descriptions.',
    output: 'A working plan and a proposed first read-only call.',
    why: 'The plan gives the run direction, but each result can change the next step.',
    state: 'Plan recorded; first hypothesis is “recent deploy may be related.”'
  },
  {
    label: 'Request logs',
    owner: 'Model',
    phase: 'Tool proposal',
    title: 'Ask for evidence the model does not have',
    description: 'The model emits search_logs with a service and time window. This is a structured request, not execution.',
    input: 'The current plan plus the search_logs tool schema.',
    output: 'search_logs({ service: "api", since_minutes: 15 })',
    why: 'Fresh logs are external evidence. The model should not invent current system behavior.',
    state: 'A pending tool call exists; the environment is unchanged.'
  },
  {
    label: 'Validate & dispatch',
    owner: 'Harness',
    phase: 'Execution gate',
    title: 'Check the call before it runs',
    description: 'The harness resolves the tool name, validates arguments, checks access, applies a timeout, and invokes the implementation.',
    input: 'The proposed call, schema, user permissions, and execution limits.',
    output: 'An authorized read-only log query sent to the log service.',
    why: 'The model cannot grant itself permission or bypass the tool contract.',
    state: 'Call and policy decision recorded in the trace.'
  },
  {
    label: 'Observe the result',
    owner: 'Tool',
    phase: 'Observation',
    title: 'Bring the outside world back into context',
    description: 'The log service returns structured results. The harness attaches the result to the original call and adds it to the next model input.',
    input: 'A validated search request.',
    output: '42 database timeouts beginning at 14:06, with representative log entries.',
    why: 'The next decision should use the returned evidence, including errors or empty results.',
    state: 'Logs saved; the deployment hypothesis is still unverified.'
  },
  {
    label: 'Replan',
    owner: 'Model',
    phase: 'Planning',
    title: 'Update the plan from new evidence',
    description: 'The model notices the timeout cluster and proposes checking deployment metadata to test whether the spike follows a release.',
    input: 'Goal, working plan, and log result.',
    output: 'get_deployments({ service: "api", since_minutes: 30 })',
    why: 'Planning is a loop. The model chooses the next useful observation rather than following fixed steps blindly.',
    state: 'Hypothesis refined; second read-only call pending.'
  },
  {
    label: 'Correlate signals',
    owner: 'Harness + tool',
    phase: 'Execution & observation',
    title: 'Check the deployment timeline',
    description: 'The harness validates and runs get_deployments, then returns release metadata. The release occurred two minutes before timeouts began.',
    input: 'Deployment query, permissions, and current evidence.',
    output: 'Release 8f2c at 14:04; latency rose at 14:06.',
    why: 'Timing supports a hypothesis, but correlation alone does not prove a root cause.',
    state: 'Two signals collected; confidence improves but is not absolute.'
  },
  {
    label: 'Verify the outcome',
    owner: 'Harness + model',
    phase: 'Verification',
    title: 'Check the answer against the goal',
    description: 'The model summarizes evidence and uncertainty. The harness checks that the answer includes the affected service, timeline, evidence, and a safe recommendation.',
    input: 'Logs, deployment data, goal criteria, and proposed final answer.',
    output: 'Likely release-related database regression; recommend reviewing the changed query and considering rollback after approval.',
    why: 'A fluent answer is not enough; the run needs evidence and a clear distinction between recommendation and action.',
    state: 'Acceptance checks pass; no rollback has run.'
  },
  {
    label: 'Report or pause',
    owner: 'Harness',
    phase: 'Stop',
    title: 'Return a defensible result',
    description: 'The harness ends with a report. If the user chooses rollback, it starts a separate approved write path with its own checks.',
    input: 'Verified answer and execution trace.',
    output: 'Findings, confidence, remaining uncertainty, and a proposed mitigation.',
    why: 'The goal is to resolve the user’s task within the authorized boundary, then stop.',
    state: 'Run completed; trace and outcome are available for review.'
  }
];

const codeSteps = [
  {
    label: 'Locate the workspace', owner: 'Harness', phase: 'Intake', title: 'Start with the right project',
    description: 'The user asks why checkout tests started failing. The harness selects the repository and records the task goal.',
    input: '“Investigate failing checkout tests after the last commit.”',
    output: 'Workspace reference, repository scope, instructions, and success criteria.',
    why: 'The agent needs an explicit project boundary before it can inspect files.',
    state: 'Goal and workspace recorded; no command has run.'
  },
  {
    label: 'Prepare a sandbox', owner: 'Harness', phase: 'Environment', title: 'Give the task a constrained place to run',
    description: 'The harness creates or resumes a sandbox with the repository files and required runtime. A container or VM may back it.',
    input: 'Workspace files, allowed capabilities, resource limits.',
    output: 'An execution environment with a shell and the checkout project.',
    why: 'Tool calls need a real execution target and a boundary for their effects.',
    state: 'Sandbox ready; repository mounted or copied.'
  },
  {
    label: 'Plan the investigation', owner: 'Model', phase: 'Planning', title: 'Pick a useful first check',
    description: 'The model proposes running the checkout tests, then inspecting the failing assertion and recent code changes.',
    input: 'Goal, repository context, tool schemas, and sandbox availability.',
    output: 'Working plan and a run_shell_command request.',
    why: 'A test run gives concrete failure evidence before code changes are suggested.',
    state: 'Plan recorded; shell command pending.'
  },
  {
    label: 'Run the test', owner: 'Harness + tool', phase: 'Execution', title: 'Dispatch the command through the tool runtime',
    description: 'The harness validates the shell request and executes npm test -- checkout inside the sandbox. The shell starts the test process.',
    input: 'Command, policy, time limit, and sandbox handle.',
    output: 'Exit code 1 and a failing checkout timeout assertion.',
    why: 'The model requested the command; the harness controlled execution and captured its result.',
    state: 'Test result and command trace saved.'
  },
  {
    label: 'Inspect the cause', owner: 'Model + tools', phase: 'Observation', title: 'Use the failure to narrow the search',
    description: 'The model reads the test and checkout client configuration, then compares recent changes. Each request passes through the same validation and dispatch path.',
    input: 'Stack trace, failing assertion, repository files, and diff.',
    output: 'Evidence of a timeout setting changed in the last commit.',
    why: 'A stack trace identifies a symptom; file and diff evidence help explain the cause.',
    state: 'Likely regression identified; no file has been changed.'
  },
  {
    label: 'Verify and report', owner: 'Harness + model', phase: 'Completion', title: 'Separate evidence from the proposed fix',
    description: 'The model reports the changed setting and a proposed fix. The harness checks the answer against the goal and records any remaining uncertainty.',
    input: 'Test output, relevant file lines, diff, and acceptance criteria.',
    output: 'A diagnosis with cited evidence and a suggested configuration correction.',
    why: 'The run should stop with a reviewable result, not an unsupported claim that the bug is fixed.',
    state: 'Investigation complete; implementation remains a separate authorized step.'
  }
];

let steps = incidentSteps;
const stepList = document.querySelector('#step-list');
const fields = {
  count: document.querySelector('#step-count'),
  owner: document.querySelector('#step-owner'),
  phase: document.querySelector('#step-phase'),
  title: document.querySelector('#step-title'),
  description: document.querySelector('#step-description'),
  input: document.querySelector('#step-input'),
  output: document.querySelector('#step-output'),
  why: document.querySelector('#step-why'),
  state: document.querySelector('#step-state')
};
const previous = document.querySelector('#prev-step');
const next = document.querySelector('#next-step');
const reset = document.querySelector('#reset-step');
let currentStep = 0;

function renderTimeline() {
  stepList.replaceChildren();
  steps.forEach((step, index) => {
  const item = document.createElement('li');
  const button = document.createElement('button');
  const number = document.createElement('span');
  number.className = 'step-index';
  number.textContent = String(index + 1).padStart(2, '0');
  button.type = 'button';
  button.append(number, document.createTextNode(step.label));
  button.addEventListener('click', () => renderStep(index));
  button.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const delta = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
    const target = Math.max(0, Math.min(steps.length - 1, index + delta));
    renderStep(target);
    stepList.querySelectorAll('button')[target].focus();
  });
  item.append(button);
    stepList.append(item);
  });
}

function renderStep(index) {
  currentStep = index;
  const step = steps[index];
  fields.count.textContent = `${index + 1} / ${steps.length}`;
  fields.owner.textContent = step.owner;
  fields.phase.textContent = step.phase;
  fields.title.textContent = step.title;
  fields.description.textContent = step.description;
  fields.input.textContent = step.input;
  fields.output.textContent = step.output;
  fields.why.textContent = step.why;
  fields.state.textContent = step.state;
  stepList.querySelectorAll('button').forEach((button, buttonIndex) => {
    if (buttonIndex === index) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  previous.disabled = index === 0;
  next.disabled = index === steps.length - 1;
}

previous.addEventListener('click', () => renderStep(Math.max(0, currentStep - 1)));
next.addEventListener('click', () => renderStep(Math.min(steps.length - 1, currentStep + 1)));
reset.addEventListener('click', () => renderStep(0));
document.querySelectorAll('[data-scenario]').forEach(button => {
  button.addEventListener('click', () => {
    steps = button.dataset.scenario === 'code' ? codeSteps : incidentSteps;
    document.querySelectorAll('[data-scenario]').forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
    renderTimeline();
    renderStep(0);
  });
});
renderTimeline();
renderStep(0);

const toolChoices = {
  logs: {
    label: 'Useful, but repeats a completed read',
    explanation: 'The logs already show when timeouts began. Another identical query is unlikely to resolve whether a deployment coincided with the spike. Change the query only if you need a different signal or time window.',
    control: 'Read-only call; schema and access checks still apply.'
  },
  deployments: {
    label: 'Best next observation',
    explanation: 'Deployment metadata directly tests the current hypothesis. The harness validates the service and time window, runs the read-only call, and returns the result for the next model turn.',
    control: 'Read-only call; execute after validation and authorization.'
  },
  rollback: {
    label: 'Premature and side-effecting',
    explanation: 'The cause is not yet verified, and rollback changes production state. The harness should pause for an approval decision before any rollback, even if the model proposes it confidently.',
    control: 'Write action; require policy check and explicit approval.'
  }
};
const result = document.querySelector('#tool-result');
document.querySelectorAll('[data-tool-choice]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-tool-choice]').forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
    const choice = toolChoices[button.dataset.toolChoice];
    result.replaceChildren();
    const label = document.createElement('span');
    label.className = 'mini-label';
    label.textContent = 'Decision note';
    const heading = document.createElement('strong');
    heading.textContent = choice.label;
    const explanation = document.createElement('p');
    explanation.textContent = choice.explanation;
    const control = document.createElement('p');
    control.textContent = choice.control;
    result.append(label, heading, explanation, control);
  });
});
