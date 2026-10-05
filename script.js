import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter } from 'k6/metrics';

const users = new SharedArray('login credentials', function () {
  const csvContent = open('./data/users.csv', 'r');
  const lines = csvContent
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);

  return lines
    .slice(1)
    .map((line) => {
      const [user, ...rest] = line.split(',');
      const passwd = rest.join(',').trim();
      return { user: user.trim(), passwd: passwd.trim() };
    })
    .filter(({ user, passwd }) => user && passwd);
});

const baseUrl = (__ENV.BASE_URL || 'https://fakestoreapi.com').replace(/\/$/, '');
const loginRequests = new Counter('login_requests');

export const options = {
  scenarios: {
    login_at_20_tps: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 40,
      maxVUs: 140,
      gracefulStop: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['max<1500', 'p(95)<1500'],
    http_req_failed: ['rate<0.03'],
    checks: ['rate>0.97'],
    dropped_iterations: ['count==0'],
    login_requests: ['count>=6000'],
  },
};

export default function () {
  if (!users || users.length === 0) {
    return;
  }

  const index = (__VU + __ITER) % users.length;
  const credentials = users[index];

  const response = http.post(
    `${baseUrl}/auth/login`,
    JSON.stringify({
      username: credentials.user,
      password: credentials.passwd,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '60s',
      tags: { name: 'POST /auth/login' },
    }
  );

  loginRequests.add(1);

  check(response, {
    'login returns HTTP 200': (res) => res.status === 200,
    'login returns a token': (res) => {
      try {
        const token = res.json('token');
        return typeof token === 'string' && token.length > 0;
      } catch (_) {
        return false;
      }
    },
  });

  sleep(0.1);
}
