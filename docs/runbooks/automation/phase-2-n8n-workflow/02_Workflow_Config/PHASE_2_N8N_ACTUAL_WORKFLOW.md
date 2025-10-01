---
title: phase-2-n8n-actual-workflow
type: runbook
domain: automation
owner: ops
last-reviewed: 2025-09-30
---

{
  "nodes": [
    {
      "parameters": {
        "multipleMethods": true,
        "httpMethod": [
          "POST"
        ],
        "path": "api/forms/analyze",
        "authentication": "none",
        "responseMode": "responseNode",
        "webhookNotice": "",
        "webhookStreamingNotice": "",
        "responseCode": 200,
        "responseData": "firstEntryJson",
        "responseBinaryPropertyName": "data",
        "options": {
          "allowedOrigins": "*",
          "ignoreBots": true,
          "noResponseBody": false
        }
      },
      "id": "ea1cead7-93f9-4195-aed8-273eb0e33efe",
      "name": "Form Submission Webhook (/api/forms/analyze)",
      "type": "n8n-nodes-base.webhook",
      "position": [
        -1000,
        -875
      ],
      "typeVersion": 2.1,
      "webhookId": "a233adb0-00ec-43c9-b10a-90b7011de888"
    },
    {
      "parameters": {
        "language": "javaScript",
        "notice": "",
        "mode": "runOnceForAllItems",
        "jsCode": "const body = items[0].json || {};\nconst formData = body.formData || body || {};\n// Normalize fields\nconst email = formData.email || formData.userEmail || '';\nconst phone = formData.phone || formData.phoneNumber || '';\nconst requiredG3 = ['name','loanType','propertyType','currentRate','outstandingLoan','monthlyIncome','lockInStatus','urgency'];\nconst completeness = requiredG3.reduce((acc,k)=> acc + (formData[k]!==undefined && formData[k]!=='' ? 1:0),0);\nlet gate = 'G1';\nif (email && phone && completeness >= 3) gate = 'G2';\nif (email && phone && completeness >= requiredG3.length) gate = 'G3';\nitems[0].json = { formData, email, phone, gate, receivedAt: new Date().toISOString() };\nreturn items;"
      },
      "id": "c9e001ad-de7f-419e-90d8-98fccf831276",
      "name": "Parse & Gate Detector",
      "type": "n8n-nodes-base.code",
      "position": [
        -750,
        -875
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "mode": "expression",
        "rules": {
          "values": [
            {
              "renameOutput": true,
              "outputKey": "G1",
              "conditions": {
                "options": {
                  "caseSensitive": false,
                  "typeValidation": "loose"
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.gate }}",
                    "rightValue": "G1",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              }
            },
            {
              "renameOutput": true,
              "outputKey": "G2",
              "conditions": {
                "options": {
                  "caseSensitive": false,
                  "typeValidation": "loose"
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.gate }}",
                    "rightValue": "G2",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              }
            },
            {
              "renameOutput": true,
              "outputKey": "G3",
              "conditions": {
                "options": {
                  "caseSensitive": false,
                  "typeValidation": "loose"
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.gate }}",
                    "rightValue": "G3",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              }
            }
          ]
        },
        "options": {
          "fallbackOutput": "none",
          "ignoreCase": true,
          "allMatchingOutputs": false
        },
        "numberOutputs": 3,
        "output": "={{ $json.gate === 'G1' ? 0 : ($json.gate === 'G2' ? 1 : 2) }}"
      },
      "id": "9de37efd-9ea1-4ac9-a663-0b31f76141ff",
      "name": "Gate Router (G1/G2/G3)",
      "type": "n8n-nodes-base.switch",
      "position": [
        -500,
        -875
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "keepOnlySet": false,
        "values": {},
        "options": {},
        "assignments": [
          {
            "id": "a1",
            "name": "email",
            "value": "={{ $json.email }}",
            "type": "string"
          },
          {
            "id": "a2",
            "name": "subject",
            "value": "Welcome to NextNest – Market insights inside",
            "type": "string"
          },
          {
            "id": "a3",
            "name": "template",
            "value": "basic_market_overview",
            "type": "string"
          },
          {
            "id": "a4",
            "name": "marketContext",
            "value": "Market average hovering around 3.2%. Window could narrow in coming months. Complete profile to unlock your Personal Mortgage Brain analysis.",
            "type": "string"
          }
        ]
      },
      "id": "af5026da-afc7-43ce-a34d-c9a7c1cf2bbe",
      "name": "Gate 1 Insights (Basic Market Overview)",
      "type": "n8n-nodes-base.set",
      "position": [
        -250,
        -875
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "https://api.resend.com/emails",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {
          "response": {
            "response": {
              "fullResponse": false,
              "neverError": true,
              "responseFormat": "json"
            }
          },
          "timeout": 15000
        },
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESEND_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "from": "NextNest <no-reply@nextnest.sg>",
          "to": [
            "={{ $json.email }}"
          ],
          "subject": "={{ $json.subject }}",
          "react": "<BasicMarketOverview email=\"{{ $json.email }}\" marketContext=\"{{ $json.marketContext }}\" ctaLink=\"https://nextnest.sg/complete-profile\"/>"
        }
      },
      "id": "841dc115-9acd-46b7-8bf2-7620cc41a6e0",
      "name": "Resend Email: Gate 1 Confirmation & CTA",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        0,
        -875
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "language": "javaScript",
        "notice": "",
        "mode": "runOnceForAllItems",
        "jsCode": "const { formData } = items[0].json;\nconst summary = {\n  eligibilitySignals: [\n    'Stable income required',\n    'Lock-in status impacts timing',\n    'Market window may tighten'\n  ],\n  recommendations: [\n    'Gather last 3 months payslips',\n    'Check outstanding loan statement',\n    'Complete full profile for tailored options'\n  ]\n};\nitems[0].json.g2 = summary;\nreturn items;"
      },
      "id": "bc586fe4-7117-454c-922a-c21b8e56922b",
      "name": "Gate 2 Analysis Builder",
      "type": "n8n-nodes-base.code",
      "position": [
        250,
        -875
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "https://api.resend.com/emails",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {
          "response": {
            "response": {
              "fullResponse": false,
              "neverError": true,
              "responseFormat": "json"
            }
          },
          "timeout": 15000
        },
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESEND_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "from": "NextNest <no-reply@nextnest.sg>",
          "to": [
            "={{ $json.email }}"
          ],
          "subject": "Your eligibility overview",
          "react": "<Gate2Eligibility name=\"{{ $json.formData.name || 'Client' }}\" insights=\"{{ JSON.stringify($json.g2) }}\" ctaLink=\"https://nextnest.sg/complete-profile\"/>"
        }
      },
      "id": "b6b883b4-d3bc-4354-b298-91c51adde619",
      "name": "Resend Email: Gate 2 Eligibility & Recommendations",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        500,
        -875
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "language": "javaScript",
        "notice": "",
        "mode": "runOnceForAllItems",
        "jsCode": "const { formData } = items[0].json;\nconst missing = [];\nconst req = ['name','loanType','propertyType','currentRate','outstandingLoan','monthlyIncome','lockInStatus','urgency'];\nfor (const k of req) if(!formData[k] && formData[k]!==0) missing.push(k);\nif (missing.length) { items[0].json.validation = { ok:false, missing }; return items; }\nconst income = Number(formData.monthlyIncome)||0;\nconst estMonthlyDebt = (Number(formData.outstandingLoan)||0) * 0.003; // rough proxy\nconst dsr = income ? (estMonthlyDebt/income) : null;\nitems[0].json.validation = { ok:true, dsr: Number(dsr?.toFixed(2)) };\nreturn items;"
      },
      "id": "d53767b6-f323-40b7-8399-b6d45f9e7cb0",
      "name": "Gate 3 Profile Validator & Ratios",
      "type": "n8n-nodes-base.code",
      "position": [
        750,
        -875
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "aiAgentStarterCallout": "",
        "deprecated": "",
        "agent": "toolsAgent",
        "promptType": "define",
        "text": "=You are an expert mortgage advisor in Singapore with deep knowledge of banks' policies, government schemes, and market trends. Analyze this client profile and provide strategic insights without revealing specific numbers.\\n\\nClient Profile:\\n- Name: {{ $json.formData.name }}\\n- Loan Type: {{ $json.formData.loanType }}\\n- Property Type: {{ $json.formData.propertyType }}\\n- Current Rate: {{ $json.formData.currentRate }}%\\n- Outstanding Loan: SGD {{ $json.formData.outstandingLoan }}\\n- Monthly Income: SGD {{ $json.formData.monthlyIncome }}\\n- Lock-in Status: {{ $json.formData.lockInStatus }}\\n- Urgency: {{ $json.formData.urgency }}\\n\\nGenerate analysis with these components in valid JSON (do not include markdown):\\n{\\n  \"insights\": [{\"type\": \"opportunity|risk|timing|comparison\", \"title\": \"...\", \"message\": \"...\", \"urgency\": \"high|medium|low\", \"psychTrigger\": \"loss_aversion|social_proof|scarcity|authority\", \"value\": \"...\"}],\\n  \"bankMatches\": [{\"description\": \"Bank profile without name\", \"strength\": \"Key advantage\", \"likelihood\": \"High|Medium|Low\"}],\\n  \"nextSteps\": {\"immediate\": [], \"shortTerm\": [], \"strategic\": []}\\n}\\nRemember: NEVER reveal specific savings amounts, exact interest rates, or actual bank names.",
        "notice": "",
        "hasOutputParser": false,
        "options": {
          "systemMessage": "You are \"Personal Mortgage Brain\" at NextNest. Be precise, Singapore-specific, and comply with instructions. If data is insufficient, state assumptions and ask for missing info without blocking progress.",
          "maxIterations": 1,
          "returnIntermediateSteps": false,
          "enableStreaming": false
        },
        "dataSource": "postgres",
        "credentials": "",
        "sqLiteFileNotice": "",
        "binaryPropertyName": "data",
        "input": "",
        "needsFallback": false
      },
      "id": "3237e406-e3d7-4339-a856-b3aac7c446c6",
      "name": "Mortgage Analysis Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "position": [
        1000,
        -875
      ],
      "typeVersion": 1.9
    },
    {
      "parameters": {
        "notice": "",
        "model": "openai/gpt-4o-mini",
        "options": {
          "temperature": 0.3,
          "maxTokens": 2000,
          "topP": 1,
          "timeout": 60000,
          "maxRetries": 2
        }
      },
      "id": "ed00115c-9931-47ff-9ca4-b4f203cccb0f",
      "name": "OpenRouter GPT-4 (2000 tokens, stable)",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenRouter",
      "position": [
        -1000,
        -625
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "notice": "",
        "sessionKey": "={{ $json.email || $json.formData.email || 'anon' }}",
        "sessionIdType": "fromInput",
        "contextWindowLength": 5
      },
      "id": "c5ca5a01-af1a-4fe7-82bb-68e61de14794",
      "name": "Analysis Memory",
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "position": [
        -750,
        -625
      ],
      "typeVersion": 1.3
    },
    {
      "parameters": {
        "language": "javaScript",
        "notice": "",
        "mode": "runOnceForAllItems",
        "jsCode": "const raw = items[0].json;\nlet parsed = null;\ntry {\n  // Some AI nodes return text in raw.output or raw.data\n  const text = raw.text || raw.output || raw.data || raw.response || raw.message || JSON.stringify(raw);\n  parsed = typeof text === 'string' ? JSON.parse(text) : text;\n} catch(e){ parsed = null; }\nitems[0].json.ai = parsed;\nreturn items;"
      },
      "id": "a309f30f-ab4c-43c3-a32c-845f1c51450e",
      "name": "AI JSON Output Parser",
      "type": "n8n-nodes-base.code",
      "position": [
        -500,
        -625
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.ai.nextSteps }}",
              "operation": "isSet"
            }
          ]
        },
        "combineOperation": "all",
        "looseTypeValidation": true,
        "options": {
          "ignoreCase": true
        }
      },
      "id": "37f3b816-1371-4d14-bbd0-105b53bcedc6",
      "name": "AI Output Valid?",
      "type": "n8n-nodes-base.if",
      "position": [
        -250,
        -625
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "keepOnlySet": false,
        "values": {},
        "options": {},
        "assignments": [
          {
            "id": "f1",
            "name": "ai",
            "type": "json",
            "value": "={\"insights\":[{\"type\":\"opportunity\",\"title\":\"Market window may narrow\",\"message\":\"Refinance windows tend to tighten within quarters; acting early preserves optionality.\",\"urgency\":\"high\",\"psychTrigger\":\"loss_aversion\",\"value\":\"Protect against rising costs\"}],\"bankMatches\":[{\"description\":\"Leading local bank with flexible criteria\",\"strength\":\"Flexible income assessment\",\"likelihood\":\"High\"}],\"nextSteps\":{\"immediate\":[\"Book strategy call\"],\"shortTerm\":[\"Upload payslips\"],\"strategic\":[\"Review in 3 months\"]}}"
          }
        ]
      },
      "id": "cda6f895-e2d5-4e40-9263-208ee9e5e080",
      "name": "Psych Trigger Fallback Templates",
      "type": "n8n-nodes-base.set",
      "position": [
        0,
        -625
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "language": "javaScript",
        "notice": "",
        "mode": "runOnceForAllItems",
        "jsCode": "const { formData={}, gate, ai } = items[0].json;\nconst completenessMax = 30, financeMax = 40, urgencyMax = 20, engageMax = 10;\nconst g3Fields = ['name','loanType','propertyType','currentRate','outstandingLoan','monthlyIncome','lockInStatus','urgency'];\nconst completeCount = g3Fields.reduce((a,k)=> a + (formData[k]?1:0),0);\nconst completeness = Math.round((completeCount/g3Fields.length)*completenessMax);\nconst income = Number(formData.monthlyIncome)||0;\nconst outstanding = Number(formData.outstandingLoan)||0;\nconst dsr = income? (outstanding*0.003/income) : 0;\nlet finance = financeMax;\nif (!income) finance -= 20;\nif (dsr>0.55) finance -= 15;\nif (dsr>0.65) finance -= 25;\nif (gate==='G1') finance -= 25;\nlet urgency = 5;\nconst u = (formData.urgency||'').toString().toLowerCase();\nif (u.includes('immediate')) urgency = urgencyMax;\nelse if (u.includes('2')||u.includes('week')) urgency = 12;\nelse urgency = 8;\nconst engagement = gate==='G3'? engageMax : gate==='G2'? 7 : 3;\nlet score = Math.max(0, Math.min(100, completeness+finance+urgency+engagement));\nlet segment = 'Cold';\nif (score>=80) segment='Premium'; else if (score>=60) segment='Qualified'; else if (score>=40) segment='Developing';\nitems[0].json.lead = { score, segment, dsr: Number(dsr.toFixed(2)) };\nreturn items;"
      },
      "id": "c234691c-4003-4804-a73b-d2a45bece05c",
      "name": "Lead Score Calculator",
      "type": "n8n-nodes-base.code",
      "position": [
        250,
        -625
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "mode": "expression",
        "rules": {
          "values": [
            {
              "renameOutput": true,
              "outputKey": "Premium",
              "conditions": {
                "options": {
                  "caseSensitive": false,
                  "typeValidation": "loose"
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.lead.segment }}",
                    "rightValue": "Premium",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              }
            },
            {
              "renameOutput": true,
              "outputKey": "Qualified",
              "conditions": {
                "options": {
                  "caseSensitive": false,
                  "typeValidation": "loose"
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.lead.segment }}",
                    "rightValue": "Qualified",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              }
            },
            {
              "renameOutput": true,
              "outputKey": "Developing",
              "conditions": {
                "options": {
                  "caseSensitive": false,
                  "typeValidation": "loose"
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.lead.segment }}",
                    "rightValue": "Developing",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              }
            },
            {
              "renameOutput": true,
              "outputKey": "Cold",
              "conditions": {
                "options": {
                  "caseSensitive": false,
                  "typeValidation": "loose"
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.lead.segment }}",
                    "rightValue": "Cold",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              }
            }
          ]
        },
        "options": {
          "fallbackOutput": "none",
          "ignoreCase": true
        },
        "numberOutputs": 4,
        "output": "={{ $json.lead.segment === 'Premium' ? 0 : ($json.lead.segment === 'Qualified' ? 1 : ($json.lead.segment === 'Developing' ? 2 : 3)) }}"
      },
      "id": "860077cd-9809-4f3d-af63-295872b3280e",
      "name": "Lead Segmentation Switch",
      "type": "n8n-nodes-base.switch",
      "position": [
        500,
        -625
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "authentication": "airtableTokenApi",
        "oldVersionNotice": "",
        "deprecated": "",
        "application": {
          "mode": "url",
          "value": ""
        },
        "table": {
          "mode": "id",
          "value": "={{ $env.AIRTABLE_LEADS_TABLE_ID }}"
        },
        "resource": "record",
        "operation": "append",
        "base": {
          "mode": "id",
          "value": "={{ $env.AIRTABLE_BASE_ID }}"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "Email": "={{ $json.email || $json.formData.email }}",
            "Phone": "={{ $json.phone || $json.formData.phone }}",
            "Name": "={{ $json.formData.name }}",
            "Gate": "={{ $json.gate }}",
            "Lead Score": "={{ $json.lead.score }}",
            "Segment": "={{ $json.lead.segment }}",
            "DSR": "={{ $json.lead.dsr }}",
            "AI Analysis JSON": "={{ JSON.stringify($json.ai) }}",
            "Created At": "={{ $json.receivedAt }}"
          }
        },
        "options": {
          "typecast": true
        }
      },
      "id": "56a97cae-50ed-4163-9825-35fe7f32e50b",
      "name": "Airtable: Upsert Lead, Analysis, Score, Segment",
      "type": "n8n-nodes-base.airtable",
      "position": [
        750,
        -625
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.lead.segment }}",
              "operation": "equals",
              "value2": "Premium"
            }
          ]
        },
        "combineOperation": "all",
        "options": {
          "ignoreCase": true
        }
      },
      "id": "53b503e1-6fe9-4c6a-b532-af713c27b318",
      "name": "Premium Alert to Slack (if premium)",
      "type": "n8n-nodes-base.if",
      "position": [
        1000,
        -625
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "oldVersionNotice": "",
        "authentication": "accessToken",
        "resource": "message",
        "operation": "post",
        "select": "channel",
        "channelId": {
          "mode": "id",
          "value": "={{ $env.SLACK_ALERT_CHANNEL_ID || 'C1234567890' }}"
        },
        "messageType": "text",
        "text": "=🔥 Premium lead: {{ $json.formData.name || $json.email }} | Score: {{ $json.lead.score }} | Urgency: {{ $json.formData.urgency }} | Gate: {{ $json.gate }}"
      },
      "id": "5bc41c80-31ab-4521-9fa9-8d91e432bb69",
      "name": "Slack: Premium Lead Alert",
      "type": "n8n-nodes-base.slack",
      "position": [
        -1000,
        -375
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "keepOnlySet": false,
        "values": {},
        "options": {},
        "assignments": [
          {
            "id": "e1",
            "name": "resendApi",
            "type": "string",
            "value": "={{ $env.RESEND_API_KEY ? 'configured' : 'missing' }}"
          },
          {
            "id": "e2",
            "name": "listmonkUrl",
            "type": "string",
            "value": "={{ $env.LISTMONK_URL || 'https://listmonk.example.com' }}"
          }
        ]
      },
      "id": "c6026beb-c085-4878-b2ba-47a9161dc133",
      "name": "Email Systems Config (Resend + Listmonk)",
      "type": "n8n-nodes-base.set",
      "position": [
        -750,
        -375
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "mode": "expression",
        "rules": {
          "values": [
            {
              "renameOutput": true,
              "outputKey": "Transactional",
              "conditions": {
                "options": {
                  "caseSensitive": false,
                  "typeValidation": "loose"
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.messageType }}",
                    "rightValue": "transactional",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              }
            },
            {
              "renameOutput": true,
              "outputKey": "Campaign",
              "conditions": {
                "options": {
                  "caseSensitive": false,
                  "typeValidation": "loose"
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.messageType }}",
                    "rightValue": "campaign",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              }
            }
          ]
        },
        "numberOutputs": 2,
        "output": "={{ $json.messageType === 'transactional' ? 0 : 1 }}"
      },
      "id": "8571538a-8975-4f2e-8337-ca2d9faf8729",
      "name": "Delivery Router (Transactional vs Campaign)",
      "type": "n8n-nodes-base.switch",
      "position": [
        -500,
        -375
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "keepOnlySet": false,
        "values": {},
        "options": {},
        "assignments": [
          {
            "id": "p1",
            "name": "messageType",
            "type": "string",
            "value": "transactional"
          },
          {
            "id": "p2",
            "name": "emailSubject",
            "type": "string",
            "value": "Priority processing started – NextNest"
          }
        ]
      },
      "id": "f5af9e52-db16-41fb-b664-947e67afd6e1",
      "name": "Premium Branch",
      "type": "n8n-nodes-base.set",
      "position": [
        -250,
        -375
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "https://api.resend.com/emails",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {},
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESEND_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "from": "NextNest <no-reply@nextnest.sg>",
          "to": [
            "={{ $json.email || $json.formData.email }}"
          ],
          "subject": "={{ $json.emailSubject }}",
          "react": "<PremiumImmediate name=\"{{ $json.formData.name || 'Client' }}\" promise=\"Callback within 2 hours\"/>"
        }
      },
      "id": "ba6da916-2807-4e3b-9072-7a598a98a62d",
      "name": "Resend: Premium Immediate Confirmation",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        0,
        -375
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "resume": "timeInterval",
        "incomingAuthentication": "none",
        "dateTime": "",
        "amount": 2,
        "unit": "hours",
        "webhookNotice": "",
        "formNotice": "",
        "formTitle": "",
        "formDescription": "",
        "formFields": {},
        "responseMode": "onReceived",
        "httpMethod": "GET",
        "responseCode": 200,
        "responseData": "firstEntryJson",
        "responseBinaryPropertyName": "data",
        "limitWaitTime": false,
        "limitType": "afterTimeInterval",
        "resumeAmount": 1,
        "resumeUnit": "hours",
        "maxDateAndTime": "",
        "options": {}
      },
      "id": "3686031a-d227-4cd5-83cd-5eb6b7959329",
      "name": "Wait 2h (Premium SMS Escalation)",
      "type": "n8n-nodes-base.wait",
      "position": [
        250,
        -375
      ],
      "typeVersion": 1.1
    },
    {
      "parameters": {
        "options": {},
        "resource": "sms",
        "operation": "send",
        "from": "={{ $env.TWILIO_FROM }}",
        "to": "={{ $json.phone || $json.formData.phone }}",
        "toWhatsapp": false,
        "message": "=Hi {{ $json.formData.name || 'there' }}, it’s NextNest. Your analysis is ready. Check your email or book: https://nextnest.sg/consult"
      },
      "id": "5b5496a5-bf5c-46c4-b832-18d52f32edc8",
      "name": "Twilio SMS (No Email Open)",
      "type": "n8n-nodes-base.twilio",
      "position": [
        500,
        -375
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "resume": "timeInterval",
        "incomingAuthentication": "none",
        "dateTime": "",
        "amount": 4,
        "unit": "hours",
        "webhookNotice": "",
        "formNotice": "",
        "formTitle": "",
        "formDescription": "",
        "formFields": {},
        "responseMode": "onReceived",
        "httpMethod": "GET",
        "responseCode": 200,
        "responseData": "firstEntryJson",
        "responseBinaryPropertyName": "data",
        "limitWaitTime": false,
        "limitType": "afterTimeInterval",
        "resumeAmount": 1,
        "resumeUnit": "hours",
        "maxDateAndTime": "",
        "options": {}
      },
      "id": "b2824862-73d0-4082-b4da-ccc009632e65",
      "name": "Wait 4h (WhatsApp Follow-up)",
      "type": "n8n-nodes-base.wait",
      "position": [
        750,
        -375
      ],
      "typeVersion": 1.1
    },
    {
      "parameters": {
        "resource": "message",
        "operation": "send",
        "messageType": "text",
        "phoneNumberId": "={{ $env.WHATSAPP_PHONE_ID || '' }}",
        "recipientPhoneNumber": "={{ $json.phone || $json.formData.phone }}",
        "textBody": "=Hi {{ $json.formData.name || 'there' }}, quick WhatsApp from NextNest: choose a time here to talk strategy: https://nextnest.sg/book"
      },
      "id": "b6884e6d-02c3-4314-be4f-b6776c6fdc84",
      "name": "WhatsApp Follow-up with Calendar Link",
      "type": "n8n-nodes-base.whatsApp",
      "position": [
        1000,
        -375
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "resume": "timeInterval",
        "incomingAuthentication": "none",
        "dateTime": "",
        "amount": 1,
        "unit": "days",
        "webhookNotice": "",
        "formNotice": "",
        "formTitle": "",
        "formDescription": "",
        "formFields": {},
        "responseMode": "onReceived",
        "httpMethod": "GET",
        "responseCode": 200,
        "responseData": "firstEntryJson",
        "responseBinaryPropertyName": "data",
        "limitWaitTime": false,
        "limitType": "afterTimeInterval",
        "resumeAmount": 1,
        "resumeUnit": "hours",
        "maxDateAndTime": "",
        "options": {}
      },
      "id": "d2770109-91b2-43e4-b0e0-7d08c7403e09",
      "name": "Wait 1d (Personal Mortgage Brain Email)",
      "type": "n8n-nodes-base.wait",
      "position": [
        -1000,
        -125
      ],
      "typeVersion": 1.1
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "https://api.resend.com/emails",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {},
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESEND_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "from": "NextNest <no-reply@nextnest.sg>",
          "to": [
            "={{ $json.email || $json.formData.email }}"
          ],
          "subject": "Your Personal Mortgage Brain insights",
          "react": "<PMBInsights insights=\"{{ JSON.stringify($json.ai || {}) }}\" ctaLink=\"https://nextnest.sg/book\"/>"
        }
      },
      "id": "79eaf86d-e7ac-40e5-a834-38f406b468e6",
      "name": "Resend: Personal Mortgage Brain Email",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        -750,
        -125
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "keepOnlySet": false,
        "values": {},
        "options": {},
        "assignments": [
          {
            "id": "q1",
            "name": "messageType",
            "type": "string",
            "value": "transactional"
          },
          {
            "id": "q2",
            "name": "emailSubject",
            "type": "string",
            "value": "Thanks – we’re preparing your insights"
          }
        ]
      },
      "id": "3c16c9fc-8bc2-41eb-913c-eafed65c9017",
      "name": "Qualified Branch",
      "type": "n8n-nodes-base.set",
      "position": [
        -500,
        -125
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "https://api.resend.com/emails",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {},
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESEND_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "from": "NextNest <no-reply@nextnest.sg>",
          "to": [
            "={{ $json.email || $json.formData.email }}"
          ],
          "subject": "={{ $json.emailSubject }}",
          "react": "<QualifiedConfirm name=\"{{ $json.formData.name || 'Client' }}\"/>"
        }
      },
      "id": "8ddc499d-b730-464b-b6e6-429ec2135557",
      "name": "Resend: Qualified Confirmation",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        -250,
        -125
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "resume": "timeInterval",
        "incomingAuthentication": "none",
        "dateTime": "",
        "amount": 2,
        "unit": "hours",
        "webhookNotice": "",
        "formNotice": "",
        "formTitle": "",
        "formDescription": "",
        "formFields": {},
        "responseMode": "onReceived",
        "httpMethod": "GET",
        "responseCode": 200,
        "responseData": "firstEntryJson",
        "responseBinaryPropertyName": "data",
        "limitWaitTime": false,
        "limitType": "afterTimeInterval",
        "resumeAmount": 1,
        "resumeUnit": "hours",
        "maxDateAndTime": "",
        "options": {}
      },
      "id": "410203fc-227a-450d-b6f5-872126f390f8",
      "name": "Wait 2h (Qualified Analysis Email)",
      "type": "n8n-nodes-base.wait",
      "position": [
        0,
        -125
      ],
      "typeVersion": 1.1
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "https://api.resend.com/emails",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {},
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESEND_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "from": "NextNest <no-reply@nextnest.sg>",
          "to": [
            "={{ $json.email || $json.formData.email }}"
          ],
          "subject": "Your analysis is ready",
          "react": "<AnalysisReady name=\"{{ $json.formData.name || 'Client' }}\" triggers=\"scarcity, social_proof\"/>"
        }
      },
      "id": "6e55aa35-3bce-42df-a563-2f2d6c2f7742",
      "name": "Resend: Analysis Ready (with triggers)",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        250,
        -125
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "={{ $env.LISTMONK_URL || 'https://listmonk.example.com' }}/api/campaigns",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {},
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.LISTMONK_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "name": "Welcome Series",
          "subject": "Day {{ 2 }} – Getting started",
          "lists": [
            "={{ $json.lead.segment === 'Qualified' ? 'qualified_newpurchase' : 'developing_equity' }}"
          ],
          "content": "<p>Education for {{ $json.formData.loanType }}</p>",
          "type": "regular"
        }
      },
      "id": "7e69e2f5-b67f-49b2-89d4-a35eae482730",
      "name": "Listmonk: Educational Series (Day 2-7)",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        500,
        -125
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "https://api.resend.com/emails",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {},
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESEND_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "from": "NextNest <no-reply@nextnest.sg>",
          "to": [
            "={{ $json.email || $json.formData.email }}"
          ],
          "subject": "Quick strategy check-in",
          "react": "<Day8Followup name=\"{{ $json.formData.name || 'Client' }}\" bookLink=\"https://nextnest.sg/book\"/>"
        }
      },
      "id": "61566c48-c336-46ca-a324-4c94f0fb4763",
      "name": "Resend: Day 8 Personalized Follow-up",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        750,
        -125
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "={{ $env.LISTMONK_URL || 'https://listmonk.example.com' }}/api/campaigns",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {},
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.LISTMONK_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "name": "Weekly Market Intelligence",
          "subject": "Weekly mortgage intelligence",
          "lists": [
            "={{ $json.lead.segment === 'Qualified' ? 'qualified_newpurchase' : 'premium_refinance' }}"
          ],
          "content": "<p>Weekly updates and analysis.</p>",
          "type": "regular"
        }
      },
      "id": "e572ffce-7748-4875-9591-1f8265d2ce6f",
      "name": "Listmonk: Weekly Newsletters (Week 2+)",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        1000,
        -125
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "keepOnlySet": false,
        "values": {},
        "options": {},
        "assignments": [
          {
            "id": "d1",
            "name": "messageType",
            "type": "string",
            "value": "transactional"
          }
        ]
      },
      "id": "003e8f94-3e96-41ef-9d41-cad740f5681b",
      "name": "Developing Branch",
      "type": "n8n-nodes-base.set",
      "position": [
        -1000,
        125
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "https://api.resend.com/emails",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {},
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESEND_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "from": "NextNest <no-reply@nextnest.sg>",
          "to": [
            "={{ $json.email || $json.formData.email }}"
          ],
          "subject": "Welcome to NextNest – start here",
          "react": "<WelcomeDeveloping/>"
        }
      },
      "id": "0819e42a-2066-47c9-afb3-caf8b80262f6",
      "name": "Resend: Welcome Email (Developing)",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        -750,
        125
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "={{ $env.LISTMONK_URL || 'https://listmonk.example.com' }}/api/campaigns",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {},
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.LISTMONK_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "name": "Weekly Market Update",
          "subject": "Weekly mortgage market update",
          "lists": [
            "developing_equity"
          ],
          "content": "<p>Market updates and tips.</p>",
          "type": "regular"
        }
      },
      "id": "1f8c045e-d4af-4e37-9ba7-88e81a07c099",
      "name": "Listmonk: Weekly Market Updates",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        -500,
        125
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "={{ $env.LISTMONK_URL || 'https://listmonk.example.com' }}/api/campaigns",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {},
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.LISTMONK_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "name": "Monthly Rate Alert",
          "subject": "Monthly rate alert",
          "lists": [
            "={{ $json.lead.segment === 'Cold' ? 'cold_general' : 'developing_equity' }}"
          ],
          "content": "<p>Policy and rate updates.</p>",
          "type": "regular"
        }
      },
      "id": "a89d787f-bac1-4fa4-a35d-9a7614fa72e6",
      "name": "Listmonk: Monthly Rate Alerts",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        -250,
        125
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "keepOnlySet": false,
        "values": {},
        "options": {},
        "assignments": [
          {
            "id": "c1",
            "name": "messageType",
            "type": "string",
            "value": "campaign"
          }
        ]
      },
      "id": "0eb31082-375f-4474-890c-4fd7ddf01f19",
      "name": "Cold Branch",
      "type": "n8n-nodes-base.set",
      "position": [
        0,
        125
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "={{ $env.LISTMONK_URL || 'https://listmonk.example.com' }}/api/campaigns",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {},
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.LISTMONK_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "name": "Monthly Market Report",
          "subject": "Monthly market report",
          "lists": [
            "cold_general"
          ],
          "content": "<p>Monthly report.</p>",
          "type": "regular"
        }
      },
      "id": "c8d9bb9f-3e03-4de9-85ec-39d68b7e1322",
      "name": "Listmonk: Monthly Market Reports",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        250,
        125
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{ $json.lead.score }}",
              "operation": "largerEqual",
              "value2": 60
            }
          ]
        },
        "combineOperation": "all"
      },
      "id": "08d0ed2a-61f1-4845-8d13-4ff1052ba4bc",
      "name": "PDF Required? (score >= 60)",
      "type": "n8n-nodes-base.if",
      "position": [
        500,
        125
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "keepOnlySet": false,
        "values": {},
        "options": {},
        "assignments": [
          {
            "id": "h1",
            "name": "pdfHtml",
            "type": "string",
            "value": "=<html><body><h1>Personalized Mortgage Strategy Report</h1><p>Prepared for {{ $json.formData.name }}</p><p>Lead Score: {{ $json.lead.score }}</p><pre>{{ JSON.stringify($json.ai,null,2) }}</pre></body></html>"
          },
          {
            "id": "h2",
            "name": "reportId",
            "type": "string",
            "value": "={{ $json.formData.name }}-{{ Date.now() }}"
          }
        ]
      },
      "id": "599003a5-5da5-4090-8bac-bea3aa493c09",
      "name": "Build PDF HTML (Template + Data)",
      "type": "n8n-nodes-base.set",
      "position": [
        750,
        125
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "authentication": "none",
        "requestMethod": "GET",
        "url": "={{ $env.PDF_RENDER_URL || 'https://pdf.nextnest.example.com/render' }}",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {
          "response": {
            "response": {
              "responseFormat": "json",
              "fullResponse": false,
              "neverError": true
            }
          }
        },
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "html": "={{ $json.pdfHtml }}",
          "options": {
            "format": "A4",
            "margin": "20mm"
          }
        }
      },
      "id": "691d728a-9ed5-411e-932b-8e7c320c7ce9",
      "name": "Generate PDF (External Renderer)",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        1000,
        125
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{ $json.output && ($json.output.size || $json.output.fileSize || 0) }}",
              "operation": "smaller",
              "value2": 2000000
            }
          ]
        },
        "combineOperation": "all"
      },
      "id": "2b285696-277e-468f-b9d2-fe1c651f098f",
      "name": "PDF Quality Check",
      "type": "n8n-nodes-base.if",
      "position": [
        -1000,
        375
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{ $json.lead.score }}",
              "operation": "largerEqual",
              "value2": 80
            }
          ]
        },
        "combineOperation": "all"
      },
      "id": "d7288039-959f-45f1-9d06-03e18a945986",
      "name": "Admin Review Needed? (score>=80 or urgent)",
      "type": "n8n-nodes-base.if",
      "position": [
        -750,
        375
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "https://api.resend.com/emails",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {},
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESEND_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "from": "NextNest <no-reply@nextnest.sg>",
          "to": [
            "brent@nextnest.sg"
          ],
          "subject": "=REVIEW: Premium Lead Report - {{ $json.formData.name }}",
          "react": "<AdminReview name=\"{{ $json.formData.name }}\" score=\"{{ $json.lead.score }}\" urgency=\"{{ $json.formData.urgency }}\"/>"
        }
      },
      "id": "340a350a-62ce-4012-a18a-d056f958ba97",
      "name": "Resend: Email PDF to Admin for Review",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        -500,
        375
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "resume": "timeInterval",
        "incomingAuthentication": "none",
        "dateTime": "",
        "amount": 30,
        "unit": "minutes",
        "webhookNotice": "",
        "formNotice": "",
        "formTitle": "",
        "formDescription": "",
        "formFields": {},
        "responseMode": "onReceived",
        "httpMethod": "GET",
        "responseCode": 200,
        "responseData": "firstEntryJson",
        "responseBinaryPropertyName": "data",
        "limitWaitTime": false,
        "limitType": "afterTimeInterval",
        "resumeAmount": 1,
        "resumeUnit": "hours",
        "maxDateAndTime": "",
        "options": {}
      },
      "id": "88656e5a-6aac-4dd9-8de7-37d777fd0e36",
      "name": "Wait 30m for Admin Approval",
      "type": "n8n-nodes-base.wait",
      "position": [
        -250,
        375
      ],
      "typeVersion": 1.1
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "https://api.resend.com/emails",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {},
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESEND_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "from": "NextNest <no-reply@nextnest.sg>",
          "to": [
            "={{ $json.email || $json.formData.email }}"
          ],
          "subject": "Your personalized report",
          "react": "<ClientDelivery link=\"https://nextnest.sg/r/{{ $json.reportId }}\"/>"
        }
      },
      "id": "8604c2cb-762f-4a00-8632-33fac575c228",
      "name": "Resend: Client Delivery (PDF & Tracking URL)",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        0,
        375
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "resume": "timeInterval",
        "incomingAuthentication": "none",
        "dateTime": "",
        "amount": 24,
        "unit": "hours",
        "webhookNotice": "",
        "formNotice": "",
        "formTitle": "",
        "formDescription": "",
        "formFields": {},
        "responseMode": "onReceived",
        "httpMethod": "GET",
        "responseCode": 200,
        "responseData": "firstEntryJson",
        "responseBinaryPropertyName": "data",
        "limitWaitTime": false,
        "limitType": "afterTimeInterval",
        "resumeAmount": 1,
        "resumeUnit": "hours",
        "maxDateAndTime": "",
        "options": {}
      },
      "id": "ca9a5ebe-ab3c-4920-9136-99d711eeda69",
      "name": "Wait 24h then Follow-up if Not Opened",
      "type": "n8n-nodes-base.wait",
      "position": [
        250,
        375
      ],
      "typeVersion": 1.1
    },
    {
      "parameters": {
        "language": "javaScript",
        "notice": "",
        "mode": "runOnceForAllItems",
        "jsCode": "// Placeholder: would query Airtable metrics webhook updates.\n// Assume not opened to demonstrate flow.\nitems[0].json.notOpened = true;\nreturn items;"
      },
      "id": "616d53a0-4da3-4a29-a927-d75509239ea3",
      "name": "Follow-up If Not Opened (Check Airtable Metrics)",
      "type": "n8n-nodes-base.code",
      "position": [
        500,
        375
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "https://api.resend.com/emails",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {},
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESEND_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "from": "NextNest <no-reply@nextnest.sg>",
          "to": [
            "={{ $json.email || $json.formData.email }}"
          ],
          "subject": "Did you see your strategy report?",
          "react": "<FollowUpReminder link=\"https://nextnest.sg/r/{{ $json.reportId }}\"/>"
        }
      },
      "id": "f0b72b61-511b-4b51-8923-9cc946f32afd",
      "name": "Resend: Follow-up Reminder",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        750,
        375
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "keepOnlySet": false,
        "values": {},
        "options": {},
        "assignments": [
          {
            "id": "cb1",
            "name": "eventStart",
            "type": "string",
            "value": "={{ $now.plus({ hours: 24 }) }}"
          },
          {
            "id": "cb2",
            "name": "eventEnd",
            "type": "string",
            "value": "={{ $now.plus({ hours: 25 }) }}"
          }
        ]
      },
      "id": "a16b4824-6d7c-4bf7-a552-891d42c5972c",
      "name": "Consultation Booking Branch",
      "type": "n8n-nodes-base.set",
      "position": [
        1000,
        375
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "useN8nTimeZone": "",
        "resource": "event",
        "operation": "create",
        "calendar": {
          "mode": "id",
          "value": "={{ $env.GOOGLE_CALENDAR_ID || 'primary' }}"
        },
        "start": "={{ $json.eventStart }}",
        "end": "={{ $json.eventEnd }}",
        "useDefaultReminders": true,
        "updateFields": {
          "summary": "=Mortgage Strategy Session – {{ $json.formData.name }}",
          "description": "=Automated booking from NextNest",
          "location": "Google Meet"
        }
      },
      "id": "15ffb57b-99ef-438c-9254-aef222bc0fcb",
      "name": "Google Calendar: Create Event (Zoom/GMeet)",
      "type": "n8n-nodes-base.googleCalendar",
      "position": [
        -1000,
        625
      ],
      "typeVersion": 1.3
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "https://api.resend.com/emails",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {},
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESEND_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "from": "NextNest <no-reply@nextnest.sg>",
          "to": [
            "={{ $json.email || $json.formData.email }}"
          ],
          "subject": "Appointment confirmed",
          "react": "<AppointmentConfirm when=\"{{ $json.eventStart }}\"/>"
        }
      },
      "id": "90252963-6f35-485f-8202-5295d0f51e02",
      "name": "Resend: Appointment Confirmation (ICS)",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        -750,
        625
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "={{ $env.LISTMONK_URL || 'https://listmonk.example.com' }}/api/campaigns",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {},
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.LISTMONK_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "name": "Consultation Reminders",
          "subject": "Reminder: Strategy call",
          "lists": [
            "premium_refinance"
          ],
          "content": "<p>Reminder before meeting.</p>",
          "type": "regular"
        }
      },
      "id": "b9d00326-9542-4fb0-9925-802a8727b17d",
      "name": "Listmonk: Reminder Campaign (1d & 1h before)",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        -500,
        625
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "authentication": "apiKey",
        "resource": "contact",
        "operation": "upsert",
        "email": "={{ $json.email || $json.formData.email }}"
      },
      "id": "b534bab3-4767-4fab-bbea-c946f3c0fd60",
      "name": "HubSpot: Sync Qualified Lead",
      "type": "n8n-nodes-base.hubspot",
      "position": [
        -250,
        625
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "enableResponseOutput": false,
        "generalNotice": "",
        "respondWith": "json",
        "credentials": "",
        "webhookNotice": "",
        "redirectURL": "",
        "responseBody": "={ \"status\": \"ok\", \"segment\": {{ $json.lead.segment }}, \"score\": {{ $json.lead.score }} }",
        "payload": "{\n  \"myField\": \"value\"\n}",
        "responseDataSource": "automatically",
        "inputFieldName": "data",
        "options": {
          "responseCode": 200
        }
      },
      "id": "76502227-7c6d-4539-a919-5f70c38f88f7",
      "name": "Respond to Webhook (Form)",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [
        0,
        625
      ],
      "typeVersion": 1.5,
      "webhookId": "ca3cd0b2-4033-4885-a61f-70b75079ba45"
    },
    {
      "parameters": {
        "multipleMethods": true,
        "httpMethod": [
          "POST"
        ],
        "path": "resend/events",
        "authentication": "none",
        "responseMode": "onReceived",
        "webhookNotice": "",
        "webhookStreamingNotice": "",
        "responseCode": 200,
        "responseData": "firstEntryJson",
        "responseBinaryPropertyName": "data",
        "options": {
          "allowedOrigins": "*",
          "ignoreBots": true
        }
      },
      "id": "0361015f-e1ea-411d-8dd2-cd3098ab7dd0",
      "name": "Resend Events Webhook (Delivery/Open/Click)",
      "type": "n8n-nodes-base.webhook",
      "position": [
        250,
        625
      ],
      "typeVersion": 2.1,
      "webhookId": "872364eb-7f91-403a-bd83-b4c0166c3216"
    },
    {
      "parameters": {
        "authentication": "airtableTokenApi",
        "oldVersionNotice": "",
        "deprecated": "",
        "application": {
          "mode": "url",
          "value": ""
        },
        "table": {
          "mode": "id",
          "value": "={{ $env.AIRTABLE_EMAIL_METRICS_TABLE_ID }}"
        },
        "resource": "record",
        "operation": "append",
        "base": {
          "mode": "id",
          "value": "={{ $env.AIRTABLE_BASE_ID }}"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "Email": "={{ $json.data && ($json.data.to || $json.to) }}",
            "Event": "={{ $json.type || $json.event }}",
            "Timestamp": "={{ $now }}"
          }
        },
        "options": {
          "typecast": true
        }
      },
      "id": "580afa39-514e-4dfb-bbf2-f45f68593f22",
      "name": "Airtable: Update Email Metrics",
      "type": "n8n-nodes-base.airtable",
      "position": [
        500,
        625
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "enableResponseOutput": false,
        "generalNotice": "",
        "respondWith": "json",
        "credentials": "",
        "webhookNotice": "",
        "redirectURL": "",
        "responseBody": "={ \"ok\": true }",
        "payload": "{\n  \"myField\": \"value\"\n}",
        "responseDataSource": "automatically",
        "inputFieldName": "data",
        "options": {
          "responseCode": 200
        }
      },
      "id": "1a25bec4-53da-43fd-b1ae-94c1a6eb5934",
      "name": "Respond to Webhook (Resend Events)",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [
        750,
        625
      ],
      "typeVersion": 1.5,
      "webhookId": "3223e2ef-2c0f-4ed6-9702-f92bbc8a4d07"
    },
    {
      "parameters": {
        "notice": "",
        "rule": {
          "interval": [
            {
              "field": "days",
              "daysInterval": 1,
              "triggerAtHour": 7,
              "triggerAtMinute": 0
            }
          ]
        }
      },
      "id": "2bd2510a-1b14-49b2-966b-24dc4bbc96ff",
      "name": "Daily Ops Scheduler",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [
        1000,
        625
      ],
      "typeVersion": 1.2,
      "webhookId": "26dbf726-a965-43e4-a577-1978f7b999d0"
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "={{ $env.LISTMONK_URL || 'https://listmonk.example.com' }}/api/subscribers/import",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {
          "timeout": 60000
        },
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "POST",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.LISTMONK_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "specifyBody": "json",
        "jsonBody": {
          "listMapping": {
            "premium_refinance": [
              "segment:Premium",
              "loanType:refinance"
            ],
            "qualified_newpurchase": [
              "segment:Qualified",
              "loanType:newpurchase"
            ],
            "developing_equity": [
              "segment:Developing",
              "loanType:equity"
            ]
          }
        }
      },
      "id": "a1556301-074f-447a-998c-174b57351344",
      "name": "Listmonk Audience Sync & Tagging",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        -1000,
        875
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "authentication": "headerAuth",
        "requestMethod": "GET",
        "url": "={{ $env.LISTMONK_URL || 'https://listmonk.example.com' }}/api/metrics",
        "allowUnauthorizedCerts": false,
        "responseFormat": "json",
        "dataPropertyName": "data",
        "jsonParameters": false,
        "options": {
          "response": {
            "response": {
              "responseFormat": "json",
              "neverError": true
            }
          }
        },
        "sendBinaryData": false,
        "binaryPropertyName": "data",
        "bodyParametersJson": "",
        "bodyParametersUi": {},
        "headerParametersJson": "",
        "headerParametersUi": {},
        "queryParametersJson": "",
        "queryParametersUi": {},
        "infoMessage": "",
        "method": "GET",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.LISTMONK_API_KEY }}"
            }
          ]
        }
      },
      "id": "9772278d-10eb-401f-98e9-16e87d6f87d2",
      "name": "Performance Metrics Pull (Resend + Listmonk)",
      "type": "n8n-nodes-base.httpRequest",
      "position": [
        -750,
        875
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "oldVersionNotice": "",
        "authentication": "oAuth2",
        "resource": "sheet",
        "operation": "append",
        "documentId": {
          "mode": "id",
          "value": "={{ $env.GSHEET_DASHBOARD_ID || '' }}"
        },
        "sheetName": {
          "mode": "name",
          "value": "Performance"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "Date": "={{ $now }}",
            "Premium Leads": "={{ 0 }}",
            "Qualified Leads": "={{ 0 }}",
            "Open Rate": "={{ 0 }}",
            "CTR": "={{ 0 }}"
          }
        },
        "options": {
          "cellFormat": "USER_ENTERED"
        },
        "range": "A:E"
      },
      "id": "8a210171-4bc9-4a8f-825b-fde9405fb16b",
      "name": "Google Sheets: Update Performance Dashboard",
      "type": "n8n-nodes-base.googleSheets",
      "position": [
        -500,
        875
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "language": "javaScript",
        "notice": "",
        "mode": "runOnceForAllItems",
        "jsCode": "// Placeholder A/B test assignment\nitems[0].json.abVariant = Math.random() < 0.5 ? 'A' : 'B';\nreturn items;"
      },
      "id": "4d367e2f-bf14-4543-adc7-b611ca511f07",
      "name": "A/B Testing Orchestrator",
      "type": "n8n-nodes-base.code",
      "position": [
        -250,
        875
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "language": "javaScript",
        "notice": "",
        "mode": "runOnceForAllItems",
        "jsCode": "// PDPA placeholders: set retention and consent flags\nitems[0].json.pdpa = { consent: true, retention_financial_years: 7, retention_marketing_years: 2 };\nreturn items;"
      },
      "id": "2ab1d8df-b9cd-445b-b52e-7708f30d8874",
      "name": "PDPA Compliance & Retention Manager",
      "type": "n8n-nodes-base.code",
      "position": [
        0,
        875
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "language": "javaScript",
        "notice": "",
        "mode": "runOnceForAllItems",
        "jsCode": "// Placeholder circuit breaker flags\nitems[0].json.cb = { resend:'ok', listmonk:'ok', openai:'ok', airtable:'ok' };\nreturn items;"
      },
      "id": "85760353-079e-44c2-9f70-1d6b9420ff30",
      "name": "Circuit Breaker & Retry Manager",
      "type": "n8n-nodes-base.code",
      "position": [
        250,
        875
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "notice": ""
      },
      "id": "d8705a8b-b3d4-4be9-b89f-bd322b0dcf05",
      "name": "Global Error Handler",
      "type": "n8n-nodes-base.errorTrigger",
      "position": [
        500,
        875
      ],
      "typeVersion": 1,
      "webhookId": "9ce1564f-9b3a-45b0-b093-01b2635b2f65"
    },
    {
      "parameters": {
        "oldVersionNotice": "",
        "authentication": "accessToken",
        "resource": "message",
        "operation": "post",
        "select": "channel",
        "channelId": {
          "mode": "id",
          "value": "={{ $env.SLACK_ERROR_CHANNEL_ID || 'C1234567890' }}"
        },
        "messageType": "text",
        "text": "=Daily error summary generated. Review dashboards for details."
      },
      "id": "90e9a3b8-e2dd-4fcf-8025-cdc63bc9fe24",
      "name": "Daily Error Summary (Slack/Email)",
      "type": "n8n-nodes-base.slack",
      "position": [
        750,
        875
      ],
      "typeVersion": 1
    }
  ]
}