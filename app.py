import datetime
import os.path

from flask import Flask, render_template, request, jsonify
from whoosh import scoring
from whoosh.fields import Schema, TEXT, ID, NUMERIC
from whoosh.index import create_in, open_dir
from whoosh.qparser import QueryParser
from time import process_time

corpus_dir = "corpus"
# Top 'n' documents as result
top_n = 10

indexdir = "indexdir"

schema = Schema(title=TEXT(stored=True),
                path=ID(stored=True),
                content=TEXT(stored=True),
                line_number=NUMERIC(int, 32, stored=True, signed=False),
                line_text=ID(stored=True))


def index_corpus():
    t_start = process_time()
    global writer
    if not os.path.exists("indexdir"):
        os.mkdir("indexdir")
    # Creating a index writer to add document as per schema
    ix = create_in("indexdir", schema)
    try:
        writer = ix.writer()
        file_paths = [os.path.join(corpus_dir, i) for i in os.listdir(corpus_dir)]
        print(file_paths)
        for path in file_paths:
            print('Indexing ', path, '...')
            with open(path, 'r') as fp:
                for line_number, line in enumerate(fp):
                    writer.add_document(title=path.split("/")[1],
                                        path=path,
                                        content=line,
                                        line_number=line_number + 1,
                                        line_text=line)
    finally:
        writer.commit()
        t_stop = process_time()
        time_taken = "{0} (HH:MM:SS)".format(datetime.timedelta(seconds=t_stop - t_start))
        print("Time taken for indexing: " + time_taken)
        return jsonify({
            'timeTaken': time_taken
        })


def search_query_string(query_string: str):
    t_start = process_time()
    search_results = []
    ix = open_dir(indexdir)
    with ix.searcher(weighting=scoring.Frequency) as searcher:
        query = QueryParser("content", ix.schema).parse(query_string)
        results = searcher.search(query, limit=None)
        for i in range(len(results)):
            search_results.append({
                "title": results[i]['title'],
                "path": results[i]['path'],
                "score": str(results[i].score),
                "content": results[i]['content'],
                "lineNumber": results[i]['line_number']
            })
    t_stop = process_time()
    return jsonify({
        "searchResults": search_results,
        "timeTaken": "{0} (HH:MM:SS)".format(datetime.timedelta(seconds=t_stop - t_start))
    })


app = Flask(__name__)


def save_document(document_name: str, text_to_index: str):
    file = open(corpus_dir + '/' + document_name, 'w')
    file.write(text_to_index)
    file.close()


def get_stored_documents():
    response = []
    file_paths = [os.path.join(corpus_dir, i) for i in os.listdir(corpus_dir)]
    for path in file_paths:
        with open(path, 'r') as fp:
            text = fp.read()
            words = text.split()
            documentName = path.split("/")[1]
            response.append({
                'documentName': documentName,
                'wordCount': len(words)
            })
    return jsonify(response)


@app.route('/', methods=['GET', 'POST'])
def search_document():
    if request.method == 'POST':
        if request.get_json()['type'] == 'search':
            return search_query_string(request.get_json()['queryString'])
        elif request.get_json()['type'] == 'indexing':
            save_document(request.get_json()['documentName'], request.get_json()['textToIndex'])
            return index_corpus()
        elif request.get_json()['type'] == 'stored_data':
            return get_stored_documents()
    else:
        return render_template('index.html')


if __name__ == '__main__':
    app.run()
