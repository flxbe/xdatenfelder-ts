export async function loadCodeList(uri: string) {
  const result = await fetch(
    `https://www.xrepository.de/api/version_codeliste/${uri}/json`
  );

  const json = result.json();

  console.log(json);
}
