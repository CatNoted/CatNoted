export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'ollama';
  apiKey?: string;
  endpoint?: string;
}

const WIDGET_TEMPLATES: Record<string, string> = {
  clock: `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
      <div id="clock-face" style="width: 100px; height: 100px; border-radius: 50%; border: 3px solid var(--primary); position: relative; background: transparent;">
        <div id="hour-hand" style="width: 4px; height: 30px; background: var(--foreground); position: absolute; left: 48px; top: 20px; transform-origin: bottom center; border-radius: 2px;"></div>
        <div id="minute-hand" style="width: 2.5px; height: 40px; background: var(--foreground); position: absolute; left: 48.75px; top: 10px; transform-origin: bottom center; border-radius: 1px;"></div>
        <div id="second-hand" style="width: 1px; height: 45px; background: #ef4444; position: absolute; left: 49.5px; top: 5px; transform-origin: bottom center;"></div>
        <div style="width: 6px; height: 6px; background: var(--primary); border-radius: 50%; position: absolute; left: 47px; top: 47px;"></div>
      </div>
      <div id="digital-time" style="font-size: 14px; font-weight: bold; font-family: monospace;">12:00:00 PM</div>
    </div>
    <script>
      function updateClock() {
        const now = new Date();
        const hrs = now.getHours();
        const mins = now.getMinutes();
        const secs = now.getSeconds();
        
        const hrDeg = (hrs % 12) * 30 + mins * 0.5;
        const minDeg = mins * 6;
        const secDeg = secs * 6;
        
        document.getElementById('hour-hand').style.transform = 'rotate(' + hrDeg + 'deg)';
        document.getElementById('minute-hand').style.transform = 'rotate(' + minDeg + 'deg)';
        document.getElementById('second-hand').style.transform = 'rotate(' + secDeg + 'deg)';
        
        document.getElementById('digital-time').innerText = now.toLocaleTimeString();
      }
      setInterval(updateClock, 1000);
      updateClock();
    </script>
  `,
  calculator: `
    <div style="background: var(--background); border: 1px solid var(--border); border-radius: 12px; padding: 12px; display: grid; gap: 8px; width: 180px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <input id="calc-display" type="text" readonly style="width: 100%; border: 1px solid var(--border); background: var(--background); color: var(--foreground); text-align: right; padding: 8px; border-radius: 6px; font-size: 14px; box-sizing: border-box;" value="0" />
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
        <button onclick="press('C')" style="grid-column: span 2; background: #ef4444; color: white; border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">C</button>
        <button onclick="press('/')" style="background: var(--primary); color: white; border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">/</button>
        <button onclick="press('*')" style="background: var(--primary); color: white; border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">*</button>
        
        <button onclick="press('7')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">7</button>
        <button onclick="press('8')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">8</button>
        <button onclick="press('9')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">9</button>
        <button onclick="press('-')" style="background: var(--primary); color: white; border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">-</button>
        
        <button onclick="press('4')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">4</button>
        <button onclick="press('5')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">5</button>
        <button onclick="press('6')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">6</button>
        <button onclick="press('+')" style="background: var(--primary); color: white; border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">+</button>
        
        <button onclick="press('1')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">1</button>
        <button onclick="press('2')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">2</button>
        <button onclick="press('3')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">3</button>
        <button onclick="press('=')" style="grid-row: span 2; background: #10b981; color: white; border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">=</button>
        
        <button onclick="press('0')" style="grid-column: span 2; background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">0</button>
        <button onclick="press('.')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">.</button>
      </div>
    </div>
    <script>
      const display = document.getElementById('calc-display');
      window.press = function(val) {
        if (val === 'C') {
          display.value = '0';
        } else if (val === '=') {
          try {
            display.value = eval(display.value) || '0';
          } catch(e) {
            display.value = 'Error';
          }
        } else {
          if (display.value === '0' || display.value === 'Error') {
            display.value = val;
          } else {
            display.value += val;
          }
        }
      }
    </script>
  `,
  todo: `
    <div style="width: 100%; max-width: 220px; border: 1px solid var(--border); padding: 12px; border-radius: 12px; display: flex; flex-direction: column; gap: 8px;">
      <h4 style="margin: 0; font-size: 12px; font-weight: bold;">Quick Tasks</h4>
      <div style="display: flex; gap: 4px;">
        <input id="todo-in" type="text" style="flex: 1; border: 1px solid var(--border); background: var(--background); color: var(--foreground); font-size: 10px; padding: 4px; border-radius: 4px;" placeholder="Add new task..." />
        <button onclick="addTodo()" style="background: var(--primary); border: none; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer;">Add</button>
      </div>
      <ul id="todo-list" style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 4px; max-height: 80px; overflow-y: auto; font-size: 10px;">
        <li style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding: 2px 0;">
          <span>Draft proposal</span>
          <button onclick="this.parentNode.remove()" style="background: none; border: none; color: red; font-size: 9px; cursor: pointer;">✕</button>
        </li>
      </ul>
    </div>
    <script>
      window.addTodo = function() {
        const input = document.getElementById('todo-in');
        if (!input.value.trim()) return;
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.borderBottom = '1px solid var(--border)';
        li.style.padding = '2px 0';
        li.innerHTML = '<span>' + input.value + '</span><button onclick="this.parentNode.remove()" style="background: none; border: none; color: red; font-size: 9px; cursor: pointer;">✕</button>';
        document.getElementById('todo-list').appendChild(li);
        input.value = '';
      }
    </script>
  `
};

export async function requestLlmWidget(prompt: string, config?: LLMConfig): Promise<{ code: string; text: string }> {
  if (config?.apiKey) {
    try {
      const url = config.endpoint || 'https://api.openai.com/v1/chat/completions';
      const body = {
        model: config.provider === 'openai' ? 'gpt-4o' : 'gemini-1.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert AI Widget generator. Output only HTML code.' },
          { role: 'user', content: prompt }
        ]
      };
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      const code = data.choices[0].message.content;
      return { code, text: 'Successfully generated widget using BYOK LLM key!' };
    } catch (e) {
      console.error('LLM API call failed, falling back to mock generator:', e);
    }
  }

  const cleanPrompt = prompt.toLowerCase();
  let selectedCode = WIDGET_TEMPLATES.todo;
  let widgetName = 'Quick Tasks Todo';

  if (cleanPrompt.includes('jam') || cleanPrompt.includes('clock') || cleanPrompt.includes('time')) {
    selectedCode = WIDGET_TEMPLATES.clock;
    widgetName = 'Analog Clock';
  } else if (cleanPrompt.includes('kalkulator') || cleanPrompt.includes('calc') || cleanPrompt.includes('math')) {
    selectedCode = WIDGET_TEMPLATES.calculator;
    widgetName = 'Mini Calculator';
  }

  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        code: selectedCode,
        text: `Space Agent (Mock Mode): Successfully compiled a secure HTML/JS widget for "${widgetName}".`
      });
    }, 800);
  });
}
