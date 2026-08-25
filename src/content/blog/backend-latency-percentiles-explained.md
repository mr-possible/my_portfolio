---
title: "Backend Latency Explained: Why p95 and p99 Matter More Than the Average"
description: "A practical, technology-neutral guide to backend latency, percentile metrics, tail latency, and what SDETs should measure in performance tests."
pubDate: 2026-08-25
tags: ["performance", "backend", "testing", "observability", "sdet"]
draft: false
---

A backend can feel fast most of the time and still deliver a frustrating user experience.

That is because latency is not one number. Every request takes a slightly different path: one hits a warm cache, another waits for a database connection, a third calls a slow downstream service, and a fourth gets caught in a queue during a traffic spike.

If we report only the average response time, we hide that variation—the exact variation users notice.

This article explains backend latency, percentile metrics such as p50, p95, and p99, and how to use them without turning observability into a statistics lecture.

<figure>
  <svg viewBox="0 0 720 330" role="img" aria-labelledby="latency-chart-title latency-chart-desc" style="width: 100%; height: auto; color: #334155;" xmlns="http://www.w3.org/2000/svg">
    <title id="latency-chart-title">Latency distribution across 10,000 requests</title>
    <desc id="latency-chart-desc">Most requests are fast, while a small long tail is much slower. Markers show p50 at 85 milliseconds, p95 at 240 milliseconds, and p99 at 780 milliseconds.</desc>
    <text x="58" y="28" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="currentColor">One endpoint: latency distribution across 10,000 requests</text>
    <line x1="58" y1="248" x2="680" y2="248" stroke="#94a3b8" stroke-width="1" />
    <path d="M580 248 C613 243 641 223 680 168 L680 248 Z" fill="#fee2e2" />
    <path d="M58 248 C88 244 99 77 145 70 C191 62 219 174 266 218 C313 257 353 243 402 244 C456 245 503 248 541 243 C593 236 631 211 680 168 L680 248 Z" fill="#dbeafe" stroke="#2563eb" stroke-width="3" />
    <line x1="270" y1="218" x2="270" y2="262" stroke="#16a34a" stroke-width="2" stroke-dasharray="5 4" />
    <line x1="535" y1="242" x2="535" y2="262" stroke="#d97706" stroke-width="2" stroke-dasharray="5 4" />
    <line x1="625" y1="219" x2="625" y2="262" stroke="#dc2626" stroke-width="2" stroke-dasharray="5 4" />
    <g font-family="system-ui, sans-serif" fill="currentColor">
      <text x="238" y="285" font-size="13" font-weight="700" fill="#16a34a">p50</text><text x="228" y="302" font-size="12">85 ms</text>
      <text x="505" y="285" font-size="13" font-weight="700" fill="#d97706">p95</text><text x="494" y="302" font-size="12">240 ms</text>
      <text x="595" y="285" font-size="13" font-weight="700" fill="#dc2626">p99</text><text x="586" y="302" font-size="12">780 ms</text>
      <text x="58" y="273" font-size="12" fill="#64748b">faster requests</text><text x="610" y="273" font-size="12" fill="#64748b">slower</text>
      <text x="72" y="102" font-size="13">Most requests are here</text>
      <path d="M169 107 L150 88" stroke="currentColor" stroke-width="1.5" />
      <text x="472" y="145" font-size="13" font-weight="700">The long tail</text><text x="472" y="164" font-size="12" fill="#64748b">Few requests, outsized user impact</text>
      <path d="M559 169 L600 203" stroke="currentColor" stroke-width="1.5" />
    </g>
  </svg>
  <figcaption>Most requests are fast. Percentiles make the slower tail visible.</figcaption>
</figure>

## Latency is the time spent waiting for a result

At its simplest, backend latency is the elapsed time between receiving a request and producing a response.

For an API, that might include:

- Network travel from the caller to the service
- Time waiting in a load balancer, thread pool, or queue
- Application processing
- Cache, database, or third-party API calls
- Response serialization and the return trip

The exact definition matters. A service may report only its own processing time, while a client experiences the full end-to-end duration. Both are useful—but they answer different questions.

> **End-to-end latency = waiting time + work time, across every component involved in serving the request.**

The user does not care which component was slow. They care that the page, checkout, search result, or transaction took too long.

## The different kinds of backend latency

When someone says “the API is slow,” they may be referring to several different things.

**End-to-end latency** is what the caller experiences: from initiating the request to receiving the final response. It is the best metric for user experience.

**Service latency** is time measured inside one service. It helps an owning team understand whether its code and direct dependencies are responsible.

**Queueing latency** is time spent waiting before work begins—for example, waiting for a worker, database connection, CPU time, or a limited concurrency slot. This often increases sharply under load.

**Dependency latency** is time spent waiting for a database, cache, message broker, third-party provider, or another internal service.

**Processing latency** is time actively spent doing useful work: validation, business rules, data transformation, and serialization.

These categories can overlap depending on where instrumentation starts and stops. The important thing is to define them consistently and label them clearly.

## Why the average lies—without technically being wrong

Imagine 100 requests:

- 95 finish in 100 ms
- 4 finish in 500 ms
- 1 finishes in 10 seconds

The average is about 217 ms.

That does not sound alarming. But one person waited 10 seconds, and four others waited half a second. If this endpoint backs a checkout or login flow, that experience matters far more than the average suggests.

Averages are useful for broad capacity trends, but they are weak at showing unevenness. Backend latency is usually not distributed neatly around a central value. It is often **long-tailed**: most requests are fast, while a small percentage are much slower.

Those slow requests are the tail.

## Percentiles: the language of the tail

A percentile tells us the latency at or below which a given percentage of requests completed.

- **p50**: 50% of requests completed at or below this value.
- **p95**: 95% completed at or below this value; the slowest 5% took longer.
- **p99**: 99% completed at or below this value; the slowest 1% took longer.

Suppose an endpoint receives 10,000 requests:

| Metric | Value | What it means |
|---|---:|---|
| p50 | 85 ms | Half of requests completed in 85 ms or less. |
| p95 | 240 ms | 9,500 requests completed in 240 ms or less; 500 took longer. |
| p99 | 780 ms | 9,900 requests completed in 780 ms or less; 100 took longer. |

The p99 does **not** mean “1% of requests take 780 ms.” It means the boundary between the fastest 99% and the slowest 1%. Some of that slowest 1% may take far longer.

## Reading p50, p95, and p99 together

A single percentile is helpful. A set of percentiles is diagnostic.

| Service | p50 | p95 | p99 |
|---|---:|---:|---:|
| A | 90 ms | 130 ms | 160 ms |
| B | 90 ms | 260 ms | 1,200 ms |

Both services have the same median latency. For the typical request, they appear equally fast.

But Service B has a serious tail-latency problem. Most requests are fine, yet a small but meaningful group has a much worse experience.

A practical interpretation:

- **p50 is high:** the system is broadly slow.
- **p50 is healthy but p95 is high:** a noticeable minority of requests is slow.
- **p95 is reasonable but p99 is high:** the rare tail needs investigation.
- **All percentiles rise together under traffic:** queueing or saturation is a likely factor.

Common causes include cache misses, lock contention, connection-pool exhaustion, retries, slow database queries, garbage collection pauses, and variable downstream dependencies.

## Why p99 can matter disproportionately

A one-percent slowdown rate sounds small until it meets scale.

At 100 requests per second, 1% means roughly 60 slow requests per minute. At 1,000 requests per second, it means around 600 slow requests per minute.

More importantly, a user journey usually involves multiple requests. If a page requires ten backend calls, each with a 1% chance of being slow, the chance that at least one is slow is closer to 10% than 1%.

This is one reason distributed systems can feel unreliable even when each individual service appears “99% good.”

## Latency compounds across dependencies

For a request that calls several services sequentially, the slowest dependency can determine the total time.

```text
Client → API Gateway → Order Service → Inventory Service → Database
```

If the order service is fast but inventory occasionally takes 900 ms, the user still experiences a slow order request.

Parallel calls have a related problem: the response often waits for the slowest branch. As systems fan out to more dependencies, rare slow events become increasingly likely to affect the overall request.

That is why teams should measure percentiles at both the entry point and important dependency boundaries.

## Percentiles are not a substitute for error metrics

A system can have excellent latency because it fails fast.

For example, an API returning a `500` response in 15 ms may improve a latency dashboard while making the product unusable.

Latency should be viewed with:

- Request volume
- Error rate
- Timeout rate
- CPU and memory usage
- Connection-pool utilization
- Queue depth
- Worker utilization

A healthy service is not merely fast. It is fast, successful, and stable under expected load.

## A practical SDET view: what to test

Performance testing should not end with:

> “The average response time was under 200 ms.”

A stronger test report answers:

- What were p50, p95, and p99 latencies?
- What was the error and timeout rate?
- At what load did the tail begin to grow?
- Which endpoint, request type, or dependency caused the degradation?
- Was the slowdown gradual, or did it begin abruptly near saturation?

Define an expected load profile and report percentiles per endpoint or user journey. Separate meaningful request classes: a simple lookup and an export job should not be pooled into the same latency distribution.

Also distinguish steady-state behavior from spikes. A system that handles 500 requests per second for an hour may still struggle during a sudden burst because queues, pools, and autoscaling react with delay.

## Turning latency into an SLO

A service-level objective (SLO) converts an expectation into a measurable commitment.

For example:

> **99% of successful `GET /products/{id}` requests should complete within 500 ms over a rolling 30-day window.**

This is clearer than saying “the API should be fast.” It specifies:

- The operation being measured
- Which responses count
- The percentile target
- The latency threshold
- The measurement window

The right target depends on the interaction. A real-time search suggestion, a background report, and a payment confirmation have different user expectations and technical constraints.

Avoid choosing p99 simply because it sounds rigorous. A p95 objective may be appropriate for one workflow; p99 may be essential for another. The choice should reflect user impact, traffic volume, and the consequences of delay.

## A note on p100 and maximum latency

“p100” is effectively the maximum observed latency. It is useful during debugging, but it is unstable as a health metric. One pathological request, client disconnect, retry storm, or measurement issue can move it dramatically.

Use maximum values to investigate individual incidents. Use p50, p95, and p99 to understand the system’s repeatable behavior.

## The key takeaway

Latency is a distribution, not a single number.

The median tells you what a typical request experiences. p95 tells you whether the slower minority is becoming painful. p99 reveals the tail—the requests most likely to drive user frustration, retries, support tickets, and cascading failures.

> Never describe backend performance with an average alone.

Measure the whole experience, watch the tail, and use percentiles alongside errors and saturation. That is where a backend’s real behavior becomes visible.
