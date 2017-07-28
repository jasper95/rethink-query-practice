GET
Find one by pk

GETALL
Find by index (default index 'id')

BETWEEN
Find by index in range (default index pk)

TABLE
Get all documents in table

INSERT
ADD document(s)

UPDATE
Update document(s) matching the given keys in object

REPLACE
Replace the entire document(s) with the given object

DELETE
Delete document(s)

SYNC
sync ensures that writes on a given table are written to permanent storage. Queries that specify soft durability ({durability: 'soft'}) do not give such guarantees, so sync can be used to ensure the state of these queries. A call to sync does not return until all previous writes to the table are persisted.

MAP
Transform each element of one or more sequences by applying a mapping function to them. If map is run with two or more sequences, it will iterate for as many items as there are in the shortest sequence.
Note that map can only be applied to sequences, not single values. If you wish to apply a function to a single value/selection (including an array), use the do command.

WITHFIELDS
Plucks one or more attributes from a sequence of objects, filtering out any objects in the sequence that do not have the specified fields. Functionally, this is identical to hasFields followed by pluck on a sequence.

CONCATMAP
Concatenate one or more elements into a single sequence using a mapping function.
concatMap works in a similar fashion to map, applying the given function to each element in a sequence, but it will always return a single sequence. If the mapping function returns a sequence, map would produce a sequence of sequences

eqJoin Implementation
r.table("posts").concatMap(function(post) {
	return r.table("comments").getAll(
		post("id"),
		{ index:"postId" }
	).map(function(comment) {
		return { left: post, right: comment }
	})
}).run(conn, callback)

ORDERBY
Sort the sequence by document values of the given key(s). To specify the ordering, wrap the attribute with either r.asc or r.desc (defaults to ascending).
Sorting without an index requires the server to hold the sequence in memory, and is limited to 100,000 documents (or the setting of the arrayLimit option for run). Sorting with an index can be done on arbitrarily large tables, or after a between command using the same index. This applies to both secondary indexes and the primary key (e.g., {index: 'id'}).
arrayLimit = 100000

SKIP
Skip a number of elements from the head of the sequence.

LIMIT
End the sequence after the given number of elements.

NTH
Get the nth element of a sequence, counting from zero. If the argument is negative, count from the last element.

UNION
Merge two or more sequences.
The optional interleave argument controls how the sequences will be merged:

true: results will be mixed together; this is the fastest setting, but ordering of elements is not guaranteed. (This is the default.)
false: input sequences will be appended to one another, left to right.
"field_name": a string will be taken as the name of a field to perform a merge-sort on. The input sequences must be ordered before being passed to union.
function: the interleave argument can take a function whose argument is the current row, and whose return value is a string to take as a field name, as with the "field_name" setting described above.

SAMPLE
Select a given number of elements from a sequence with uniform random distribution. Selection is done without replacement.
If the sequence has less than the requested number of elements (i.e., calling sample(10) on a sequence with only five elements), sample will return the entire sequence in a random order.

GROUP
Takes a stream and partitions it into multiple groups based on the fields or functions provided.
Using a function, you can also group by date on a ReQL date field.
arrayLimit = 100000

UNGROUP
If you want to operate on all the groups rather than operating on each group (e.g. if you want to order the groups by their reduction), you can use ungroup to turn a grouped stream or grouped data into an array of objects representing the groups.

MERGE
Merge two or more objects together to construct a new object with properties from all. When there is a conflict between field names, preference is given to fields in the rightmost object in the argument list. merge also accepts a subquery function that returns an object, which will be used similarly to a map function.

DIFFERENCE
Remove the elements of one array from another array.

SETINSERT
Add a value to an array and return it as a set (an array with distinct values).

()(BRACKET)
Get a single field from an object. If called on a sequence, gets that field from every object in the sequence, skipping objects that lack it.

GETFIELD
Get a single field from an object. If called on a sequence, gets that field from every object in the sequence, skipping objects that lack it

HASFIELDS
Test if an object has one or more fields. An object has a field if it has that key and the key has a non-null value. For instance, the object {'a': 1,'b': 2,'c': null} has the fields a and b.

When applied to a single object, hasFields returns true if the object has the fields and false if it does not. When applied to a sequence, it will return a new sequence (an array or stream) containing the elements that have the specified fields.

INSERTAT
Insert a value in to an array at a given index. Returns the modified array.

SPLICEAT
Insert several values in to an array at a given index. Returns the modified array.

DELETEAT
Remove one or more elements from an array at a given index. Returns the modified array. (Note: deleteAt operates on arrays, not documents; to delete documents, see the delete command.)
If only offset is specified, deleteAt removes the element at that index. If both offset and endOffset are specified, deleteAt removes the range of elements between offset and endOffset, inclusive of offset but not inclusive of endOffset.

CHANGEAT
Change a value in an array at a given index. Returns the modified array.

KEYS
Return an array containing all of an object’s keys. Note that the keys will be sorted as described in ReQL data types (for strings, lexicographically).

VALUES
Return an array containing all of an object’s values. values() guarantees the values will come out in the same order as keys.

LITERAL
Replace an object in a field instead of merging it with an existing object in a merge or update operation. Using literal with no arguments in a merge or update operation will remove the corresponding field.
Use literal to remove a field from a document

ARGS
r.args is a special term that’s used to splice an array of arguments into another term. This is useful when you want to call a variadic term such as getAll with a set of arguments produced at runtime.
This is analogous to using apply in JavaScript. (However, note that args evaluates all its arguments before passing them into the parent term, even if the parent term otherwise allows lazy evaluation.)

DO
Call an anonymous function using return values from other ReQL commands or queries as arguments.
The last argument to do (or, in some forms, the only argument) is an expression or an anonymous function which receives values from either the previous arguments or from prefixed commands chained before do. The do command is essentially a single-element map, letting you map a function over just one document. This allows you to bind a query result to a local variable within the scope of do, letting you compute the result just once and reuse it in a complex expression or in a series of ReQL commands.
Arguments passed to the do function must be basic data types, and cannot be streams or selections. While the arguments will all be evaluated before the function is executed, they may be evaluated in any order, so their values should not be dependent on one another. The type of do’s result is the type of the value returned from the function or last expression.


EQJOIN
left_table.concatMap(function(left){
		return right_table.getAll('left_table_key', {index: right_table_index})
											.map(function(right){
													return {left, right}
											})
})

SETTINGS
Write acknowledgements - are set per table with the write_acks setting, either using the config command or by writing to the table_config system table. The default is majority, meaning writes will be acknowledged when a majority of (voting) replicas have confirmed their writes. The other possible option is single, meaning writes will be acknowledged when a single replica acknowledges it.

Durability - is set per table with the durability setting, again using either reconfigure or writing to the table_config system table. In hard durability mode, writes are committed to disk before acknowledgements are sent; in soft mode, writes are acknowledged immediately after being stored in memory. The soft mode is faster but slightly less resilient to failure. The default is hard.

Read mode -  is set per query via an optional argument, read_mode (or readMode), to table. It has three possible values:
single returns values that are in memory (but not necessarily written to disk) on the primary replica. This is the default.
majority -  will only return values that are safely committed on disk on a majority of replicas. This requires sending a message to every replica on each read, so it is the slowest but most consistent.
outdated - will return values that are in memory on an arbitrarily-selected replica. This is the fastest but least consistent.

INDEXING
You cannot chain multiple getAll commands. Use a compound index to efficiently retrieve documents by multiple fields.
An orderBy command that uses a secondary index cannot be chained after getAll. You can only chain it after a table command. However, you can chain orderBy after a between command provided it uses the same index.

SIMPLE
Use simple indexes to efficiently retrieve and order documents by the value of a single field.
An orderBy command that uses a secondary index cannot be chained after getAll. You can only chain it after a table command. However, you can chain orderBy after a between command provided it uses the same index.

Creation
r.table("users").indexCreate("last_name").run(conn, callback)

QUERY
r.table("users").getAll("Smith", {index: "last_name"}).run(conn, callback)

COMPOUND INDEXES
Compound indexes use arrays to efficiently retrieve documents by multiple fields.

Creation
r.table("users").indexCreate(
    "full_name", [r.row("last_name"), r.row("first_name")]
).run(conn, callback)

QUERY
r.table("users").getAll(["Smith", "John"], {index: "full_name"}).run(conn, callback)


MULTI INDEXES
With a multi index, a document can be indexed using more than one key in the same index. For instance, a blog post might have multiple tags, and each tag might refer to multiple blog posts.

The keys in a multi index can be single values, compound values or even arbitrary expressions

Creation
r.table("posts").indexCreate("tags", {multi: true})

QUERY
r.table("posts").getAll("travel", {index: "tags"}).run(conn, callback)

Arbitrary index Creation
r.table("users").indexCreate("full_name2", function(user) {
    return r.add(user("last_name"), "_", user("first_name"))
}).run()

r.table("users").indexCreate("activities", r.row("hobbies").add(r.row("sports")),
    {multi: true}).run()

Use a multi index and a mapping function to speed getAll/contains

r.table("users").indexCreate("userEquipment", function(user) {
    return user("equipment").map(function(equipment) {
        return [ user("id"), equipment ];
    });
}, {multi: true}).run();

// Query equivalent to:
// r.table("users").getAll(1).filter(function (user) {
//     return user("equipment").contains("tent");
// });
r.table("users").getAll([1, "tent"], {index: "userEquipment"}).distinct().run();
