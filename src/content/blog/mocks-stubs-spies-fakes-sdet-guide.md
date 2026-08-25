---
title: "Mocks, Stubs, Spies, and Fakes: SDET's guide to choose the Right Test Double"
description: "A practical guide to choosing mocks, stubs, spies, fakes, and fixtures without making automated tests fragile."
pubDate: 2026-08-26
tags: ["testing", "test-automation", "sdet", "unit-testing", "vitest"]
draft: false
---

Most test suites do not suffer from a lack of mocks.

They suffer from too many things being called mocks.

A test replaces a payment API with a hard-coded response: “mock.” A test checks whether an email function was called: “mock.” A test uses an in-memory database: also “mock.” The word becomes shorthand for “not real,” and the useful distinction disappears.

That distinction matters because every kind of test double answers a different question. Choose the wrong one and your test may still pass—but it can become slow, misleading, or fragile during a harmless refactor.

The goal is not to avoid test doubles. The goal is to use them deliberately.

## First: what is a test double?

A **test double** is any replacement for a real collaborator used during a test.

The collaborator might be a database, clock, HTTP client, payment provider, message queue, email service, or another module.

We replace real collaborators for good reasons:

- Real dependencies can be slow or expensive.
- They may be unavailable or unreliable.
- Their behavior may be difficult to reproduce.
- We may need to force a rare condition, such as a timeout or declined payment.
- A unit test should usually focus on one unit’s behavior, not the health of the internet.

“Test double” is the umbrella term. A mock, stub, spy, and fake are different kinds of umbrella.

Let’s use one running example: an `OrderService`.

```ts
class OrderService {
  constructor(
    private inventory: InventoryService,
    private payments: PaymentGateway,
    private orders: OrderRepository,
    private notifier: NotificationService
  ) {}

  async placeOrder(input: CreateOrderInput) {
    const available = await this.inventory.isAvailable(input.productId);

    if (!available) {
      throw new Error('Product is out of stock');
    }

    const payment = await this.payments.charge(input.paymentDetails);

    if (!payment.success) {
      throw new Error('Payment failed');
    }

    const order = await this.orders.save(input);

    await this.notifier.sendOrderConfirmation(order);

    return order;
  }
}
```

This service has four collaborators. The question is not “Should I mock all of them?” The better question is: **what behavior am I trying to prove?**

## A stub controls an indirect input

A **stub** provides a predefined answer when the system under test asks a question.

In this example, `InventoryService` is an indirect input. `OrderService` asks, “Is this product available?” A stub lets the test control the answer.

```ts
const inventory = {
  isAvailable: vi.fn().mockResolvedValue(true),
};
```

Now the test can focus on what should happen when inventory is available.

```ts
it('creates an order when the item is in stock and payment succeeds', async () => {
  const inventory = {
    isAvailable: vi.fn().mockResolvedValue(true),
  };

  const payments = {
    charge: vi.fn().mockResolvedValue({ success: true }),
  };

  const orders = {
    save: vi.fn().mockResolvedValue({ id: 'order-123' }),
  };

  const notifier = {
    sendOrderConfirmation: vi.fn(),
  };

  const service = new OrderService(inventory, payments, orders, notifier);

  const order = await service.placeOrder(validOrderInput);

  expect(order.id).toBe('order-123');
});
```

The inventory, payment gateway, and repository are acting as stubs here. The test needs predictable responses from them.

A stub answers the question:

> “What should this dependency return so I can exercise this path?”

A useful rule: a stub is primarily about **state**—the return value or behavior needed to set up the test.

## A mock verifies an interaction

A **mock** is used when the interaction itself is part of the behavior being tested.

After successfully creating an order, sending a confirmation is not an incidental implementation detail. It is an observable requirement.

```ts
it('sends an order confirmation after saving a successful order', async () => {
  const notifier = {
    sendOrderConfirmation: vi.fn(),
  };

  const service = new OrderService(
    availableInventory,
    successfulPayments,
    savedOrderRepository,
    notifier
  );

  await service.placeOrder(validOrderInput);

  expect(notifier.sendOrderConfirmation).toHaveBeenCalledOnce();
  expect(notifier.sendOrderConfirmation).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'order-123' })
  );
});
```

Here, `notifier.sendOrderConfirmation` is a mock because the test asserts that an expected message was sent.

A mock answers:

> “Did this unit collaborate with another component in the required way?”

This is useful when the call is a genuine business outcome: sending an email, publishing an event, charging a card, or writing an audit record.

It is less useful when the assertion merely repeats the code’s internal steps.

For example, this is usually fragile:

```ts
expect(repository.getById).toHaveBeenCalledOnce();
expect(mapper.toResponse).toHaveBeenCalledOnce();
expect(logger.debug).toHaveBeenCalledWith('Starting request');
```

Those tests do not prove much user-visible behavior. They make refactoring expensive by coupling the test to the current implementation.

## A spy observes a real collaborator

A **spy** observes calls to a real function while allowing its original behavior to continue.

Imagine a formatter that normally uses a logger. You want to verify an error was recorded without replacing the entire logger.

```ts
const logger = {
  error: (message: string) => console.error(message),
};

const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

await processOrderWithInvalidInput();

expect(errorSpy).toHaveBeenCalledWith(
  expect.stringContaining('Invalid order')
);
```

Spies are useful when you want to observe behavior without building a separate replacement object.

They are also easy to misuse. A spy on an internal helper often signals that the test is reaching into implementation details. Prefer testing the public outcome whenever possible.

A spy answers:

> “What did this real collaborator receive or do?”

## A fake is a working, lightweight substitute

A **fake** is not merely configured to return values. It has a simplified but working implementation.

An in-memory repository is a classic example:

```ts
class InMemoryOrderRepository {
  private orders = new Map<string, Order>();

  async save(input: CreateOrderInput): Promise<Order> {
    const order = { id: crypto.randomUUID(), ...input };
    this.orders.set(order.id, order);
    return order;
  }

  async findById(id: string) {
    return this.orders.get(id) ?? null;
  }
}
```

This is not a mock. It actually stores and retrieves orders, just without a real database.

Fakes are useful when stateful behavior matters and simple stubs would become awkward. They can make tests expressive and fast.

But a fake creates a responsibility: it must behave sufficiently like the real dependency for the scenarios that matter. An in-memory repository will not reveal a missing database index, transaction issue, or ORM mapping bug. Those belong in integration tests.

A fake answers:

> “Can I use a simpler working version of this dependency to test meaningful behavior?”

## Fixtures are not test doubles

A **fixture** is test data.

```ts
const validOrderInput = {
  productId: 'keyboard-1',
  quantity: 1,
  paymentDetails: { token: 'test-token' },
};
```

Fixtures describe the world your test operates in. Test doubles replace the collaborators inside that world.

The distinction may sound academic, but clear names improve test readability. If everything is a “mock,” future readers must inspect the test to understand what it is doing.

## The real danger: over-mocking

Over-mocking creates tests that pass while the application is broken.

If `OrderService` calls a payment wrapper, and the payment wrapper calls an HTTP client, mocking all three layers can prove only that the mocks agree with one another.

This is especially dangerous at internal boundaries. If two modules are maintained together and communicate through ordinary function calls, using the real implementation is often simpler and more valuable.

Mock the boundary where uncertainty enters:

- An HTTP provider
- A database
- The current clock
- Randomness
- The filesystem
- A message broker
- An external SDK

Do not automatically mock:

- Small internal helpers
- Value objects
- Pure functions
- Code that is cheap and deterministic
- The very method whose behavior you are trying to test

A useful principle is:

> Mock what you do not own, fake what is expensive to run, and keep your own deterministic code real.

It is not absolute, but it is an excellent starting point.

## A practical decision guide

| If you need to… | Prefer… |
|---|---|
| Force a dependency to return a known value | Stub |
| Verify an important call or side effect occurred | Mock |
| Observe calls to an existing function | Spy |
| Use a lightweight, stateful replacement | Fake |
| Provide input data for a scenario | Fixture |
| Verify a real boundary behaves correctly | Integration test |

The category is less important than the intent. Nobody needs a taxonomy argument in a pull request. But the intent should be clear enough that another engineer can answer: “What is this double protecting us from?”

## The takeaway

Test doubles are not shortcuts around testing. They are tools for deciding what a test is allowed to depend on.

Use a stub when you need control. Use a mock when an interaction is the behavior. Use a spy when observation helps. Use a fake when you need a real, simplified implementation.

And before adding any of them, ask the question that saves the most pain:

> Would this test be clearer if I used the real collaborator instead?

Often, the best mock is no mock at all.
