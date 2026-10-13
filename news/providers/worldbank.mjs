export function createWorldBankProvider({
  fetchImpl = globalThis.fetch,
  now = () => new Date().toISOString(),
  timeoutMs = 10000,
} = {}) {
  return Object.freeze({
    async retrieve({ countryCode, year }, { signal } = {}) {
      if (
        !/^[A-Z]{2}$/.test(countryCode) ||
        !Number.isInteger(year) ||
        year < 1960 ||
        year > new Date().getUTCFullYear()
      )
        throw new Error('Invalid population query.');
      const query = { countryCode, year, indicator: 'SP.POP.TOTL' },
        retrievedAt = now();
      const base = {
        provider: 'worldbank',
        query,
        retrievedAt,
        records: [],
        error: null,
        truncated: false,
      };
      const url = new URL(
        `https://api.worldbank.org/v2/country/${countryCode}/indicator/SP.POP.TOTL`,
      );
      url.searchParams.set('date', String(year));
      url.searchParams.set('format', 'json');
      url.searchParams.set('per_page', '2');
      try {
        const response = await fetchImpl(url, {
          redirect: 'error',
          signal: AbortSignal.any([
            AbortSignal.timeout(timeoutMs),
            ...(signal ? [signal] : []),
          ]),
        });
        if (!response.ok || !response.body) throw new Error();
        let size = 0;
        const chunks = [];
        const reader = response.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.length;
            if (size > 200000) throw new Error();
            chunks.push(value);
          }
        } catch (e) {
          await reader.cancel().catch(() => {});
          throw e;
        }
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.length;
        }
        const data = JSON.parse(new TextDecoder().decode(bytes));
        if (
          !Array.isArray(data) ||
          data.length !== 2 ||
          !data[0] ||
          !Array.isArray(data[1]) ||
          data[1].length > 2 ||
          Number(data[0].pages) > 1
        )
          throw new Error();
        const records = [];
        for (const row of data[1]) {
          if (
            row?.indicator?.id !== 'SP.POP.TOTL' ||
            row.country?.id !== countryCode ||
            row.date !== String(year)
          )
            throw new Error();
          if (row.value === null) continue;
          if (
            !Number.isFinite(row.value) ||
            row.value < 0 ||
            row.value > 20_000_000_000
          )
            throw new Error();
          records.push({
            id: `worldbank:${countryCode}:SP.POP.TOTL:${year}`,
            kind: 'observation',
            provider: 'worldbank',
            sourceFamily: 'worldbank-wdi-population',
            title: `${String(row.country.value ?? countryCode).slice(0, 120)} population, ${year}`,
            url: url.href,
            retrievedAt,
            publicationTime: null,
            observationTime: null,
            eventTime: null,
            period: { kind: 'year', value: String(year) },
            places: [
              {
                name: String(row.country.value ?? countryCode).slice(0, 120),
                countryCode,
                latitude: null,
                longitude: null,
              },
            ],
            measurements: [
              {
                key: 'population',
                value: row.value,
                unit: 'people',
                methodology:
                  'World Bank SP.POP.TOTL annual total population estimate; underlying sources can include UN and national statistics.',
              },
            ],
            limitations: [
              'Annual population estimate, not a live count. Annual or midyear estimates can differ from an end-of-year national population count; a difference alone does not contradict that report. Source definitions and revisions affect comparison.',
              'World Bank may reuse national or UN statistics. Independence from the submitted report is unknown.',
              'API lastupdated is catalog metadata, not observation or publication time.',
            ],
          });
        }
        return {
          ...base,
          status: records.length ? 'ok' : 'empty',
          records: [...new Map(records.map((r) => [r.id, r])).values()],
          explanation: records.length
            ? 'Annual country population estimates retrieved from the World Bank Indicators API.'
            : 'No population value was available for the selected country and year; absence does not disprove the claim.',
        };
      } catch {
        return {
          ...base,
          status: 'error',
          error: 'World Bank retrieval failed or timed out. Try again later.',
          explanation: 'No conclusion follows from this retrieval failure.',
        };
      }
    },
  });
}
