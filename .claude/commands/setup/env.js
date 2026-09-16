#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) =>
  new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });

// 환경별 기본 템플릿
const templates = {
  local: {
    description: '로컬 개발 환경',
    variables: [
      { key: 'NEXT_PUBLIC_API_URL', default: 'http://localhost:3001' },
      { key: 'API_SECRET_KEY', default: 'local-secret-key' },
    ],
  },
  qa: {
    description: 'QA 환경',
    variables: [
      { key: 'NEXT_PUBLIC_API_URL', default: 'https://qa-api.example.com' },
      { key: 'API_SECRET_KEY', default: '' },
    ],
  },
  staging: {
    description: 'Staging 환경',
    variables: [
      { key: 'NEXT_PUBLIC_API_URL', default: 'https://staging-api.example.com' },
      { key: 'API_SECRET_KEY', default: '' },
    ],
  },
  production: {
    description: 'Production 환경',
    variables: [
      { key: 'NEXT_PUBLIC_API_URL', default: 'https://api.example.com' },
      { key: 'API_SECRET_KEY', default: '' },
    ],
  },
};

async function main() {
  const args = process.argv.slice(2);
  let environment = args[0] || 'local';

  // 유효한 환경 확인
  if (!templates[environment]) {
    console.log('\n❌ 유효하지 않은 환경입니다.');
    console.log(`   사용 가능한 환경: ${Object.keys(templates).join(', ')}\n`);
    rl.close();
    process.exit(1);
  }

  const template = templates[environment];
  const envFilePath = path.join(process.cwd(), `.env.${environment}`);
  const envContent = {};

  console.log(`\n🔧 ${template.description} (${environment}) 환경변수 설정\n`);

  // 기본 템플릿 변수 입력받기
  for (const variable of template.variables) {
    const defaultValue = variable.default ? ` (기본값: ${variable.default})` : '';
    const userValue = await question(
      `${variable.key}${defaultValue}: `,
    );
    envContent[variable.key] = userValue || variable.default;
  }

  // 추가 환경변수 입력받기
  let addMore = true;
  while (addMore) {
    const moreInput = await question(
      '\n추가 환경변수를 입력하시겠습니까? (y/n): ',
    );

    if (moreInput.toLowerCase() === 'y') {
      const key = await question('환경변수 키 (예: DATABASE_URL): ');
      const value = await question('환경변수 값: ');

      if (key && value) {
        envContent[key] = value;
        console.log(`✅ ${key} 추가됨`);
      }
    } else {
      addMore = false;
    }
  }

  // 파일 생성
  const envFileContent = Object.entries(envContent)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  try {
    fs.writeFileSync(envFilePath, envFileContent);
    console.log(`\n✅ 환경변수 파일이 생성되었습니다: ${envFilePath}\n`);

    // 생성된 내용 표시
    console.log('📝 생성된 환경변수:');
    console.log('─'.repeat(50));
    console.log(envFileContent);
    console.log('─'.repeat(50));
    console.log('\n💡 이 파일은 .gitignore에 포함되어 있어 버전 관리되지 않습니다.\n');
  } catch (error) {
    console.error(`\n❌ 파일 생성 실패: ${error.message}\n`);
    process.exit(1);
  }

  rl.close();
}

main();
