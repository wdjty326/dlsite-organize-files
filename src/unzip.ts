import extract from 'extract-zip';
import path from 'path';

async function unzipFile(zipFilePath: string, destPath: string, password?: string) {
  try {
    const absoluteZipPath = path.resolve(zipFilePath);
    const absoluteDestPath = path.resolve(destPath);

    console.log(`압축 해제 시작: ${absoluteZipPath} -> ${absoluteDestPath}`);

    const options: { dir: string; password?: string } = { dir: absoluteDestPath };
    if (password) {
      options.password = password;
    }

    await extract(absoluteZipPath, options);

    console.log('압축 해제 완료!');
  } catch (err) {
    console.error('압축 해제 중 오류 발생:', err);
    // 비밀번호 오류는 특정 에러 메시지나 코드를 확인할 수 있습니다.
    // 예: if (err.message.includes('password')) { ... }
  }
}

export default unzipFile;