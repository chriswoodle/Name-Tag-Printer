import logging
logging.raiseExceptions = False 
# ignores errors that are raised due to no logging handeler
import sys
import cups 
from xhtml2pdf import pisa 
# reads all arguments, returns list
passed_args = sys.argv[1:]
name = passed_args[0]
cert_level = passed_args[1]
time = passed_args[2]
# set printing options 
options = {'PageSize':'w28mmh89mm', 'scaling': '100' }
filename = "/home/pi/print.pdf" 
# generate content 
xhtml = "" 
xhtml += "<style>@page {size: 89mm 28mm landscape;font-size:5mm;padding:4mm;}</style>"
xhtml += "<div><div><div style='font-size:15mm;display:inline-block;'>" + cert_level + " </div>"
xhtml += "<div style='font-size:8mm;line-height:6.5mm;display:inline-block;margin-top:2mm;'>" + name + "</div></div>"
xhtml += "<div style='font-size:3mm;line-height:3mm;'>FIT Machine Shop - " + time + "</div></div>"
pdf = pisa. CreatePDF(xhtml, file(filename, "w")) 
if not pdf. err: 
	# Close PDF file - otherwise we can' t read it 
	pdf. dest. close() 
	# print the file using cups
	conn = cups. Connection() 
	# Get a list of all printers 
	printers = conn. getPrinters() 
	#for printer in printers: 
		# Print name of printers to stdout (screen) 
	#	print printer, printers[printer]["device-uri"] 
	# get first printer from printer list 
	printer_name = printers. keys()[0] 
	conn. printFile(printer_name, filename, "Python_Status_print",  options) 
else: 
	print "Unable to create pdf file" 
